import { google } from 'googleapis';

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  thumbnailLink?: string;
}

export class GoogleDriveService {
  private drive;

  constructor() {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey) {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      this.drive = google.drive({ version: 'v3', auth });
    } else {
      this.drive = null;
    }
  }

  public isConfigured(): boolean {
    return !!this.drive;
  }

  /**
   * Create an Organization or Project Folder in Google Drive
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    if (!this.drive) {
      console.warn('Google Drive API not configured. Returning mock folder ID.');
      return `mock-folder-${Date.now()}`;
    }

    try {
      const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
      }

      const res = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });

      return res.data.id || `folder-${Date.now()}`;
    } catch (error) {
      console.error('Error creating Google Drive folder:', error);
      throw error;
    }
  }

  /**
   * Get File Metadata from Google Drive
   */
  async getFileMetadata(fileId: string): Promise<DriveFileMetadata | null> {
    if (!this.drive) {
      return {
        id: fileId,
        name: 'Mock_Document.pdf',
        mimeType: 'application/pdf',
        size: 1024 * 1024 * 2.5,
        webViewLink: 'https://drive.google.com/file/d/mock/view',
      };
    }

    try {
      const res = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, webViewLink, thumbnailLink',
      });

      return {
        id: res.data.id || fileId,
        name: res.data.name || 'Untitled File',
        mimeType: res.data.mimeType || 'application/octet-stream',
        size: res.data.size ? parseInt(res.data.size, 10) : undefined,
        webViewLink: res.data.webViewLink || undefined,
        thumbnailLink: res.data.thumbnailLink || undefined,
      };
    } catch (error) {
      console.error('Error fetching file metadata from Google Drive:', error);
      return null;
    }
  }

  /**
   * Share file with anyone with link or specific user email
   */
  async makeFileReadable(fileId: string): Promise<void> {
    if (!this.drive) return;

    try {
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (error) {
      console.error('Error updating Google Drive permissions:', error);
    }
  }
}

export const googleDriveService = new GoogleDriveService();
