export interface StorageProvider {
  save(file: Express.Multer.File): Promise<StorageResult>;
  delete(filePath: string): void;
  getFilePath(storedName: string): string;
  getThumbnailPath(storedName: string): string;
}

export interface StorageResult {
  storedName: string;
  filePath: string;
  thumbnailPath: string | null;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
}
