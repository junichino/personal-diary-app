import {
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Media } from '../diary/entities/media.entity';
import { LocalDiskProvider } from './storage/local-disk.provider';

@Injectable()
export class MediaService {
  private maxFileSize: number;

  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private storageProvider: LocalDiskProvider,
    private configService: ConfigService,
  ) {
    this.maxFileSize = this.configService.get<number>(
      'upload.maxFileSize',
      10 * 1024 * 1024,
    );
  }

  async uploadFiles(
    diaryEntryId: string,
    files: Express.Multer.File[],
  ): Promise<Media[]> {
    const mediaEntities: Media[] = [];

    // Get current max sortOrder for this entry
    const lastMedia = await this.mediaRepository.findOne({
      where: { diaryEntryId },
      order: { sortOrder: 'DESC' },
    });
    let sortOrder = lastMedia ? lastMedia.sortOrder + 1 : 0;

    for (const file of files) {
      if (file.size > this.maxFileSize) {
        throw new PayloadTooLargeException(
          `File ${file.originalname} exceeds maximum size of ${this.maxFileSize / (1024 * 1024)}MB`,
        );
      }

      const result = await this.storageProvider.save(file);

      const media = this.mediaRepository.create({
        diaryEntryId,
        fileName: file.originalname,
        storedName: result.storedName,
        mimeType: result.mimeType,
        fileSize: result.fileSize,
        filePath: result.filePath,
        thumbnailPath: result.thumbnailPath ?? null,
        width: result.width ?? null,
        height: result.height ?? null,
        sortOrder,
      });

      const saved = await this.mediaRepository.save(media);
      mediaEntities.push(saved);
      sortOrder++;
    }

    return mediaEntities;
  }

  async deleteFile(mediaId: string): Promise<{ message: string }> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Delete files from disk
    await this.storageProvider.delete(media.filePath);
    if (media.thumbnailPath) {
      await this.storageProvider.delete(media.thumbnailPath);
    }

    await this.mediaRepository.remove(media);
    return { message: 'Media deleted' };
  }

  getFilePath(storedName: string): string {
    return this.storageProvider.getFilePath(storedName);
  }

  getThumbnailPath(storedName: string): string {
    return this.storageProvider.getThumbnailPath(storedName);
  }
}
