import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { MediaService } from './media.service';
import { Media } from '../diary/entities/media.entity';
import { LocalDiskProvider } from './storage/local-disk.provider';

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepo: jest.Mocked<Repository<Media>>;
  let storageProvider: jest.Mocked<LocalDiskProvider>;

  const mockMedia: Media = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    diaryEntryId: '550e8400-e29b-41d4-a716-446655440010',
    fileName: 'photo.jpg',
    storedName: 'abc-uuid.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024,
    filePath: '2026/04/abc-uuid.jpg',
    thumbnailPath: '2026/04/thumb_abc-uuid.jpg',
    width: 800,
    height: 600,
    sortOrder: 0,
    createdAt: new Date('2026-04-16'),
    diaryEntry: undefined as unknown as import('../diary/entities/diary-entry.entity').DiaryEntry,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getRepositoryToken(Media),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: LocalDiskProvider,
          useValue: {
            save: jest.fn(),
            delete: jest.fn(),
            getFilePath: jest.fn(),
            getThumbnailPath: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(10 * 1024 * 1024),
          },
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    mediaRepo = module.get(getRepositoryToken(Media));
    storageProvider = module.get(LocalDiskProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFiles', () => {
    const diaryEntryId = '550e8400-e29b-41d4-a716-446655440010';

    it('should upload files and return media entities', async () => {
      const mockFile: Express.Multer.File = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
        fieldname: 'images',
        encoding: '7bit',
        stream: null as unknown as import('stream').Readable,
        destination: '',
        filename: '',
        path: '',
      };

      mediaRepo.findOne.mockResolvedValue(null); // no existing media
      storageProvider.save.mockResolvedValue({
        storedName: 'uuid-stored.jpg',
        filePath: '2026/04/uuid-stored.jpg',
        thumbnailPath: '2026/04/thumb_uuid-stored.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024,
        width: 800,
        height: 600,
      });
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      const result = await service.uploadFiles(diaryEntryId, [mockFile]);

      expect(result).toHaveLength(1);
      expect(storageProvider.save).toHaveBeenCalledWith(mockFile);
      expect(mediaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          diaryEntryId,
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
        }),
      );
    });

    it('should throw PayloadTooLargeException when file exceeds max size', async () => {
      const oversizedFile: Express.Multer.File = {
        originalname: 'huge.jpg',
        mimetype: 'image/jpeg',
        size: 20 * 1024 * 1024, // 20MB > 10MB limit
        buffer: Buffer.from('test'),
        fieldname: 'images',
        encoding: '7bit',
        stream: null as unknown as import('stream').Readable,
        destination: '',
        filename: '',
        path: '',
      };

      mediaRepo.findOne.mockResolvedValue(null);

      await expect(
        service.uploadFiles(diaryEntryId, [oversizedFile]),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('should set correct sortOrder starting from existing media', async () => {
      const existingMedia = { ...mockMedia, sortOrder: 2 };
      mediaRepo.findOne.mockResolvedValue(existingMedia);

      const mockFile: Express.Multer.File = {
        originalname: 'photo2.jpg',
        mimetype: 'image/jpeg',
        size: 2048,
        buffer: Buffer.from('test2'),
        fieldname: 'images',
        encoding: '7bit',
        stream: null as unknown as import('stream').Readable,
        destination: '',
        filename: '',
        path: '',
      };

      storageProvider.save.mockResolvedValue({
        storedName: 'uuid2.jpg',
        filePath: '2026/04/uuid2.jpg',
        thumbnailPath: null,
        mimeType: 'image/jpeg',
        fileSize: 2048,
        width: null,
        height: null,
      });
      mediaRepo.create.mockReturnValue(mockMedia);
      mediaRepo.save.mockResolvedValue(mockMedia);

      await service.uploadFiles(diaryEntryId, [mockFile]);

      expect(mediaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sortOrder: 3,
        }),
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete media file and remove from database', async () => {
      mediaRepo.findOne.mockResolvedValue(mockMedia);
      mediaRepo.remove.mockResolvedValue(mockMedia);

      const result = await service.deleteFile(mockMedia.id);

      expect(result).toEqual({ message: 'Media deleted' });
      expect(storageProvider.delete).toHaveBeenCalledWith(mockMedia.filePath);
      expect(storageProvider.delete).toHaveBeenCalledWith(
        mockMedia.thumbnailPath,
      );
      expect(mediaRepo.remove).toHaveBeenCalledWith(mockMedia);
    });

    it('should not delete thumbnail if thumbnailPath is null', async () => {
      const mediaNoThumb = { ...mockMedia, thumbnailPath: null };
      mediaRepo.findOne.mockResolvedValue(mediaNoThumb);
      mediaRepo.remove.mockResolvedValue(mediaNoThumb);

      await service.deleteFile(mediaNoThumb.id);

      expect(storageProvider.delete).toHaveBeenCalledTimes(1);
      expect(storageProvider.delete).toHaveBeenCalledWith(
        mediaNoThumb.filePath,
      );
    });

    it('should throw NotFoundException when media not found', async () => {
      mediaRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteFile('550e8400-e29b-41d4-a716-446655440099'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFilePath', () => {
    it('should delegate to storage provider', () => {
      storageProvider.getFilePath.mockReturnValue('/uploads/abc.jpg');

      const result = service.getFilePath('abc.jpg');

      expect(result).toBe('/uploads/abc.jpg');
      expect(storageProvider.getFilePath).toHaveBeenCalledWith('abc.jpg');
    });
  });

  describe('getThumbnailPath', () => {
    it('should delegate to storage provider', () => {
      storageProvider.getThumbnailPath.mockReturnValue('/uploads/thumb_abc.jpg');

      const result = service.getThumbnailPath('abc.jpg');

      expect(result).toBe('/uploads/thumb_abc.jpg');
      expect(storageProvider.getThumbnailPath).toHaveBeenCalledWith('abc.jpg');
    });
  });
});
