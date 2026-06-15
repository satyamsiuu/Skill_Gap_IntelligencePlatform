export const STORAGE_PORT = 'STORAGE_PORT';

export interface StoragePort {
  /**
   * Uploads a file to storage and returns its storage key/URL.
   * @param buffer The file buffer
   * @param filename Original filename
   * @param mimeType Validated mime type
   * @param folder Destination folder (e.g., 'avatars' or 'resumes')
   * @returns Storage key or secure URL
   */
  uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folder: string,
  ): Promise<string>;

  /**
   * Deletes a file from storage.
   * @param storageKey The key/URL of the file
   */
  deleteFile(storageKey: string): Promise<void>;

  /**
   * Generates a signed, time-limited URL for downloading private files.
   * Not needed if files are public (like avatars), but useful for resumes.
   * @param storageKey The key/URL of the file
   */
  getSignedUrl(storageKey: string): Promise<string>;
}
