import Link from "next/link";
import type { Project, WorkspaceFile } from "@/lib/types";
import { deleteWorkspaceFile, uploadWorkspaceFile } from "@/app/(dashboard)/actions";
import { requireModuleAccess } from "@/lib/current-org";

import { can } from "@/lib/rbac";

export default async function FilesPage() {
  const { supabase, membership, organizationId, user } = await requireModuleAccess("files");

  const canViewGlobalFiles = can(membership, "files", "view_global");
  let filesQuery = supabase.from("files").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false });
  if (!canViewGlobalFiles) {
    filesQuery = filesQuery.eq("uploaded_by", user.id);
  }

  const [{ data: files }, { data: projects }] = await Promise.all([
    filesQuery,
    supabase.from("projects").select("id, name").eq("organization_id", organizationId).order("name")
  ]);

  const fileList = (files ?? []) as WorkspaceFile[];
  const projectMap = new Map(((projects ?? []) as Pick<Project, "id" | "name">[]).map((project) => [project.id, project.name]));

  const signedUrls = await Promise.all(
    fileList.slice(0, 25).map(async (file) => {
      if (file.storage_provider === "google_drive") {
        return [file.id, file.drive_web_view_link ?? file.drive_download_link ?? null] as const;
      }

      if (file.bucket_name && file.storage_path) {
        const { data } = await supabase.storage.from(file.bucket_name).createSignedUrl(file.storage_path, 60 * 15);
        return [file.id, data?.signedUrl ?? null] as const;
      }

      return [file.id, null] as const;
    })
  );
  const urlMap = new Map(signedUrls);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Documents</p>
          <h1>Files</h1>
          <p className="muted">Upload, share, and revisit workspace files from one central library.</p>
        </div>
      </section>

      <section className="split-layout">
        <form action={uploadWorkspaceFile} className="card form-card">
          <div>
            <h2>Upload file</h2>
            <p className="muted">Files are saved to Google Drive and linked back to the workspace.</p>
          </div>

          <label>
            Link to project
            <select name="project_id" defaultValue="">
              <option value="">Workspace file</option>
              {(projects ?? []).map((project: { id: string; name: string }) => (
                <option value={project.id} key={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Select file
            <input name="file" type="file" required />
          </label>

          <button className="button primary" type="submit">
            Upload
          </button>
        </form>

        <div className="card">
          <div className="card-header">
            <h2>Recent files</h2>
            <span>{fileList.length} items</span>
          </div>

          <div className="list-stack">
            {fileList.map((file) => (
              <div className="list-row" key={file.id}>
                <div>
                  <strong>{file.file_name}</strong>
                  <p className="muted">
                    {file.project_id ? `Project: ${projectMap.get(file.project_id) || "Unknown"}` : "Workspace file"} · {file.scope} · {file.storage_provider === "google_drive" ? "Google Drive" : "Legacy storage"}
                  </p>
                </div>
                <div className="row-end">
                  <span>{file.size_bytes ? `${Math.ceil(file.size_bytes / 1024)} KB` : "Unknown size"}</span>
                  {urlMap.get(file.id) ? (
                    <Link className="button small" href={urlMap.get(file.id)!} target="_blank">
                      Open
                    </Link>
                  ) : null}
                  <form action={deleteWorkspaceFile}>
                    <input type="hidden" name="file_id" value={file.id} />
                    <button className="button danger small" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}

            {!fileList.length ? <p className="muted">No files uploaded yet.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
