import { Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { StorageProvider, StorageResult } from './storage-provider.interface';

@Injectable()
export class LocalDiskProvider implements StorageProvider {
  private uploadDir: string;
  private allowedMimeTypes: string[];

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('upload.dir', './uploads');
    this.allowedMimeTypes = this.configService.get<string[]>(
      'upload.allowedMimeTypes',
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    );
  }

  async save(file: Express.Multer.File): Promise<StorageResult> {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        `File type ${file.mimetype} is not supported. Allowed: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const uuid = uuidv4();
    const ext = this.getExtension(file.mimetype);

    const storedName = `${uuid}.${ext}`;
    const relativePath = path.join(year, month, storedName);
    const absoluteDir = path.join(this.uploadDir, year, month);
    const absolutePath = path.join(this.uploadDir, relativePath);

    // Ensure directory exists
    fs.mkdirSync(absoluteDir, { recursive: true });

    // Save original file
    fs.writeFileSync(absolutePath, file.buffer);

    // Get image metadata
    let width: number | null = null;
    let height: number | null = null;
    let thumbnailPath: string | null = null;

    try {
      const metadata = await sharp(file.buffer).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;

      // Generate thumbnail
      const thumbName = `thumb_${uuid}.${ext}`;
      const thumbRelativePath = path.join(year, month, thumbName);
      const thumbAbsolutePath = path.join(this.uploadDir, thumbRelativePath);

      await sharp(file.buffer)
        .resize(400, undefined, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbAbsolutePath);

      thumbnailPath = thumbRelativePath;
    } catch {
      // If sharp fails (e.g., for GIF), skip thumbnail
    }

    return {
      storedName,
      filePath: relativePath,
      thumbnailPath,
      mimeType: file.mimetype,
      fileSize: file.size,
      width,
      height,
    };
  }

  async delete(filePath: string): Promise<void> {
    const absolutePath = path.join(this.uploadDir, filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }

  getFilePath(storedName: string): string {
    // Search for file in uploads directory
    return this.findFile(storedName);
  }

  getThumbnailPath(storedName: string): string {
    const parts = storedName.split('.');
    const ext = parts.pop();
    const name = parts.join('.');
    const thumbName = `thumb_${name}.${ext}`;
    return this.findFile(thumbName);
  }

  private findFile(fileName: string): string {
    // Try to find the file by walking directories
    const searchDir = (dir: string): string | null => {
      if (!fs.existsSync(dir)) return null;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const found = searchDir(fullPath);
          if (found) return found;
        } else if (entry.name === fileName) {
          return fullPath;
        }
      }
      return null;
    };

    const found = searchDir(this.uploadDir);
    return found ?? path.join(this.uploadDir, fileName);
  }

  private getExtension(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    return mimeMap[mimeType] ?? 'jpg';
  }
}
