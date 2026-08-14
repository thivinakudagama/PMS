import { createSign } from "node:crypto";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

type GoogleDriveConfig = {
  clientEmail: string;
  privateKey: string;
  rootFolderId: string;
};

type GoogleDriveFile = {
  id: string;
  name: string;
  webViewLink?: string | null;
  webContentLink?: string | null;
  parents?: string[];
  mimeType?: string;
  size?: string;
};

let tokenCache: { token: string; expiresAt: number } | null = null;

function getConfig(): GoogleDriveConfig {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (!clientEmail || !privateKey || !rootFolderId) {
    throw new Error(
      "Missing Google Drive configuration. Set GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, and GOOGLE_DRIVE_ROOT_FOLDER_ID."
    );
  }

  return { clientEmail, privateKey, rootFolderId };
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }

  const { clientEmail, privateKey } = getConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: DRIVE_SCOPE,
    aud: TOKEN_ENDPOINT,
    exp: now + 3600,
    iat: now
  };

  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey);
  const assertion = `${unsigned}.${base64UrlEncode(signature)}`;

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    throw new Error(`Unable to authenticate with Google Drive: ${await response.text()}`);
  }

  const json = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000
  };

  return json.access_token;
}

async function driveFetch(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Google Drive request failed: ${response.status} ${await response.text()}`);
  }

  return response;
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findFolder(name: string, parentId: string) {
  const query = [
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
    `'${parentId}' in parents`,
    `name = '${escapeDriveQueryValue(name)}'`
  ].join(" and ");

  const response = await driveFetch(
    `${DRIVE_API}/files?${new URLSearchParams({
      q: query,
      fields: "files(id,name,parents)",
      includeItemsFromAllDrives: "true",
      supportsAllDrives: "true"
    })}`
  );

  const json = (await response.json()) as { files?: GoogleDriveFile[] };
  return json.files?.[0] ?? null;
}

async function createFolder(name: string, parentId: string) {
  const response = await driveFetch(`${DRIVE_API}/files?supportsAllDrives=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      parents: [parentId],
      mimeType: "application/vnd.google-apps.folder"
    })
  });

  return (await response.json()) as GoogleDriveFile;
}

export async function ensureDriveFolder(name: string, parentId: string) {
  const existing = await findFolder(name, parentId);
  if (existing) return existing;
  return createFolder(name, parentId);
}

export async function ensureProjectDriveFolders(workspaceName: string, projectName?: string | null, scope?: string) {
  const { rootFolderId } = getConfig();

  const workspaceFolder = await ensureDriveFolder(workspaceName, rootFolderId);

  if (!projectName) {
    return {
      rootFolderId,
      workspaceFolder,
      projectFolder: null,
      scopeFolder: workspaceFolder
    };
  }

  const projectFolder = await ensureDriveFolder(projectName, workspaceFolder.id);
  const scopeFolder =
    scope && !["workspace", "project"].includes(scope)
      ? await ensureDriveFolder(scope.charAt(0).toUpperCase() + scope.slice(1), projectFolder.id)
      : projectFolder;

  return {
    rootFolderId,
    workspaceFolder,
    projectFolder,
    scopeFolder
  };
}

export async function uploadFileToDrive(input: {
  file: File;
  folderId: string;
  fileName: string;
}) {
  const metadata = {
    name: input.fileName,
    parents: [input.folderId]
  };

  const boundary = `drive-upload-${Date.now()}`;
  const fileBuffer = Buffer.from(await input.file.arrayBuffer());
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
    ),
    Buffer.from(`--${boundary}\r\nContent-Type: ${input.file.type || "application/octet-stream"}\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--`)
  ]);

  const response = await driveFetch(`${DRIVE_UPLOAD_API}?uploadType=multipart&supportsAllDrives=true`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body
  });

  const uploaded = (await response.json()) as GoogleDriveFile;

  const permissionResponse = await driveFetch(`${DRIVE_API}/files/${uploaded.id}/permissions?supportsAllDrives=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "reader",
      type: "anyone"
    })
  });
  await permissionResponse.json();

  const detailsResponse = await driveFetch(
    `${DRIVE_API}/files/${uploaded.id}?${new URLSearchParams({
      fields: "id,name,parents,webViewLink,webContentLink,mimeType,size",
      supportsAllDrives: "true"
    })}`
  );

  return (await detailsResponse.json()) as GoogleDriveFile;
}

export async function deleteDriveFile(fileId: string) {
  await driveFetch(`${DRIVE_API}/files/${fileId}?supportsAllDrives=true`, {
    method: "DELETE"
  });
}
