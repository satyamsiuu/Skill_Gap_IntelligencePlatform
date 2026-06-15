export interface Document {
  id: string;
  studentProfileId: string;
  type: 'RESUME' | 'CERTIFICATE' | 'PROJECT_EVIDENCE';
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  scanStatus: 'QUARANTINED' | 'AVAILABLE' | 'REJECTED';
  createdAt: string;
}

export const documentsApi = {
  upload: async (file: File, type: string): Promise<{ data: Document }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch('/api/v1/documents/upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || 'Upload failed');
    }

    return { data: await response.json() };
  },
};
