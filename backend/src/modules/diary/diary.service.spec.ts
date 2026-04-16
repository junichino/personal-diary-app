import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { DiaryService } from './diary.service';
import { DiaryEntry, Mood } from './entities/diary-entry.entity';
import { DiaryTag } from './entities/diary-tag.entity';
import { MediaService } from '../media/media.service';

describe('DiaryService', () => {
  let service: DiaryService;
  let diaryRepo: jest.Mocked<Repository<DiaryEntry>>;
  let diaryTagRepo: jest.Mocked<Repository<DiaryTag>>;
  let mediaService: jest.Mocked<MediaService>;

  const mockEntry: DiaryEntry = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    content: 'วันนี้เป็นวันที่ดี',
    mood: Mood.HAPPY,
    moodScore: 5,
    location: 'Bangkok',
    weather: 'Sunny',
    temperature: 32,
    isPinned: false,
    isBookmarked: false,
    entryDate: '2026-04-16',
    entryTime: '14:30:00',
    createdAt: new Date('2026-04-16'),
    updatedAt: new Date('2026-04-16'),
    deletedAt: null,
    media: [],
    diaryTags: [],
  };

  const createMockQueryBuilder = (
    data: DiaryEntry[],
    count: number,
  ): Partial<SelectQueryBuilder<DiaryEntry>> => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(count),
    getMany: jest.fn().mockResolvedValue(data),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiaryService,
        {
          provide: getRepositoryToken(DiaryEntry),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            softRemove: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DiaryTag),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: MediaService,
          useValue: {
            uploadFiles: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DiaryService>(DiaryService);
    diaryRepo = module.get(getRepositoryToken(DiaryEntry));
    diaryTagRepo = module.get(getRepositoryToken(DiaryTag));
    mediaService = module.get(MediaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated diary entries with default params', async () => {
      const qb = createMockQueryBuilder([mockEntry], 1);
      diaryRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as SelectQueryBuilder<DiaryEntry>,
      );

      const result = await service.findAll({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      expect(result.data).toEqual([mockEntry]);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should apply mood filter', async () => {
      const qb = createMockQueryBuilder([], 0);
      diaryRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as SelectQueryBuilder<DiaryEntry>,
      );

      await service.findAll({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        mood: Mood.HAPPY,
      });

      expect(qb.andWhere).toHaveBeenCalledWith('entry.mood = :mood', {
        mood: Mood.HAPPY,
      });
    });

    it('should apply date range filter', async () => {
      const qb = createMockQueryBuilder([], 0);
      diaryRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as SelectQueryBuilder<DiaryEntry>,
      );

      await service.findAll({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'entry.entryDate >= :startDate',
        { startDate: '2026-01-01' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'entry.entryDate <= :endDate',
        { endDate: '2026-12-31' },
      );
    });

    it('should apply search filter', async () => {
      const qb = createMockQueryBuilder([], 0);
      diaryRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as SelectQueryBuilder<DiaryEntry>,
      );

      await service.findAll({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        search: 'test keyword',
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        "entry.content LIKE :search ESCAPE '!'",
        { search: '%test keyword%' },
      );
    });

    it('should apply tag filter', async () => {
      const qb = createMockQueryBuilder([], 0);
      diaryRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as SelectQueryBuilder<DiaryEntry>,
      );

      await service.findAll({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        tag: 'ท่องเที่ยว',
      });

      expect(qb.andWhere).toHaveBeenCalledWith('tag.name = :tagName', {
        tagName: 'ท่องเที่ยว',
      });
    });

    it('should apply bookmark and pin filters', async () => {
      const qb = createMockQueryBuilder([], 0);
      diaryRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as SelectQueryBuilder<DiaryEntry>,
      );

      await service.findAll({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        isBookmarked: true,
        isPinned: true,
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'entry.isBookmarked = :isBookmarked',
        { isBookmarked: true },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'entry.isPinned = :isPinned',
        { isPinned: true },
      );
    });

    it('should calculate totalPages correctly', async () => {
      const qb = createMockQueryBuilder([mockEntry], 50);
      diaryRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as SelectQueryBuilder<DiaryEntry>,
      );

      const result = await service.findAll({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      expect(result.meta.totalPages).toBe(5);
    });

    it('should filter out soft deleted entries (deletedAt IS NULL)', async () => {
      const qb = createMockQueryBuilder([mockEntry], 1);
      diaryRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as SelectQueryBuilder<DiaryEntry>,
      );

      await service.findAll({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      expect(qb.where).toHaveBeenCalledWith('entry.deletedAt IS NULL');
    });

    it('should escape LIKE wildcards in search using ! as escape char', async () => {
      const qb = createMockQueryBuilder([], 0);
      diaryRepo.createQueryBuilder.mockReturnValue(
        qb as unknown as SelectQueryBuilder<DiaryEntry>,
      );

      await service.findAll({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
        search: '100% discount_offer',
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        "entry.content LIKE :search ESCAPE '!'",
        { search: '%100!% discount!_offer%' },
      );
    });
  });

  describe('findOne', () => {
    it('should return diary entry by id with relations', async () => {
      diaryRepo.findOne.mockResolvedValue(mockEntry);

      const result = await service.findOne(mockEntry.id);

      expect(result).toEqual(mockEntry);
      expect(diaryRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockEntry.id },
        relations: ['media', 'diaryTags', 'diaryTags.tag'],
        order: { media: { sortOrder: 'ASC' } },
      });
    });

    it('should throw NotFoundException when entry not found', async () => {
      diaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('550e8400-e29b-41d4-a716-446655440099'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create diary entry with basic fields', async () => {
      const savedEntry = { ...mockEntry };
      diaryRepo.create.mockReturnValue(savedEntry);
      diaryRepo.save.mockResolvedValue(savedEntry);
      diaryRepo.findOne.mockResolvedValue(savedEntry);

      const result = await service.create({
        content: 'วันนี้เป็นวันที่ดี',
        mood: Mood.HAPPY,
        moodScore: 5,
      });

      expect(result).toEqual(savedEntry);
      expect(diaryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'วันนี้เป็นวันที่ดี',
          mood: Mood.HAPPY,
          moodScore: 5,
        }),
      );
    });

    it('should create diary entry with tags', async () => {
      const savedEntry = { ...mockEntry };
      diaryRepo.create.mockReturnValue(savedEntry);
      diaryRepo.save.mockResolvedValue(savedEntry);
      diaryRepo.findOne.mockResolvedValue(savedEntry);

      const tagId = '550e8400-e29b-41d4-a716-446655440010';
      const mockDiaryTag = {
        diaryEntryId: savedEntry.id,
        tagId,
      } as DiaryTag;
      diaryTagRepo.create.mockReturnValue(mockDiaryTag);
      diaryTagRepo.save.mockResolvedValue(mockDiaryTag);

      await service.create({
        content: 'with tags',
        tagIds: [tagId],
      });

      expect(diaryTagRepo.create).toHaveBeenCalledWith({
        diaryEntryId: savedEntry.id,
        tagId,
      });
      expect(diaryTagRepo.save).toHaveBeenCalled();
    });

    it('should create diary entry with file uploads', async () => {
      const savedEntry = { ...mockEntry };
      diaryRepo.create.mockReturnValue(savedEntry);
      diaryRepo.save.mockResolvedValue(savedEntry);
      diaryRepo.findOne.mockResolvedValue(savedEntry);

      const mockFiles = [
        { originalname: 'photo.jpg', size: 1024 } as Express.Multer.File,
      ];

      await service.create({ content: 'with photo' }, mockFiles);

      expect(mediaService.uploadFiles).toHaveBeenCalledWith(
        savedEntry.id,
        mockFiles,
      );
    });

    it('should set default entryDate and entryTime when not provided', async () => {
      const savedEntry = { ...mockEntry };
      diaryRepo.create.mockReturnValue(savedEntry);
      diaryRepo.save.mockResolvedValue(savedEntry);
      diaryRepo.findOne.mockResolvedValue(savedEntry);

      await service.create({ content: 'no date provided' });

      expect(diaryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isPinned: false,
          isBookmarked: false,
        }),
      );
      // entryDate and entryTime should be set from current date
      const callArgs = diaryRepo.create.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(callArgs.entryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(callArgs.entryTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('update', () => {
    it('should update diary entry fields', async () => {
      const existingEntry = { ...mockEntry };
      diaryRepo.findOne.mockResolvedValue(existingEntry);
      diaryRepo.save.mockResolvedValue(existingEntry);

      await service.update(mockEntry.id, {
        content: 'Updated content',
        mood: Mood.SAD,
      });

      expect(diaryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Updated content',
          mood: Mood.SAD,
        }),
      );
    });

    it('should replace tags when tagIds provided', async () => {
      const existingEntry = { ...mockEntry };
      diaryRepo.findOne.mockResolvedValue(existingEntry);
      diaryRepo.save.mockResolvedValue(existingEntry);

      const newTagId = '550e8400-e29b-41d4-a716-446655440020';
      diaryTagRepo.create.mockReturnValue({
        diaryEntryId: mockEntry.id,
        tagId: newTagId,
      } as DiaryTag);
      diaryTagRepo.save.mockResolvedValue({ diaryEntryId: mockEntry.id, tagId: newTagId } as DiaryTag);

      await service.update(mockEntry.id, { tagIds: [newTagId] });

      expect(diaryTagRepo.delete).toHaveBeenCalledWith({
        diaryEntryId: mockEntry.id,
      });
      expect(diaryTagRepo.create).toHaveBeenCalledWith({
        diaryEntryId: mockEntry.id,
        tagId: newTagId,
      });
    });

    it('should remove media when removeMediaIds provided', async () => {
      const existingEntry = { ...mockEntry };
      diaryRepo.findOne.mockResolvedValue(existingEntry);
      diaryRepo.save.mockResolvedValue(existingEntry);

      const mediaId = '550e8400-e29b-41d4-a716-446655440030';
      await service.update(mockEntry.id, { removeMediaIds: [mediaId] });

      expect(mediaService.deleteFile).toHaveBeenCalledWith(mediaId);
    });

    it('should throw NotFoundException when entry not found', async () => {
      diaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('550e8400-e29b-41d4-a716-446655440099', {
          content: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set optional fields to null when explicitly provided as undefined-like', async () => {
      const existingEntry = {
        ...mockEntry,
        mood: Mood.HAPPY,
        location: 'Bangkok',
      };
      diaryRepo.findOne.mockResolvedValue(existingEntry);
      diaryRepo.save.mockResolvedValue(existingEntry);

      await service.update(mockEntry.id, {
        mood: undefined,
        location: undefined,
      });

      // mood and location should NOT change since undefined means "don't update"
      expect(existingEntry.mood).toBe(Mood.HAPPY);
      expect(existingEntry.location).toBe('Bangkok');
    });
  });

  describe('remove', () => {
    it('should soft delete diary entry using softDelete (not softRemove)', async () => {
      diaryRepo.findOne.mockResolvedValue(mockEntry);
      diaryRepo.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      const result = await service.remove(mockEntry.id);

      expect(result).toEqual({ message: 'Diary entry deleted' });
      // Must use softDelete(id) not softRemove(entity) to avoid cascade issues
      expect(diaryRepo.softDelete).toHaveBeenCalledWith(mockEntry.id);
      expect(diaryRepo.softRemove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when entry not found', async () => {
      diaryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.remove('550e8400-e29b-41d4-a716-446655440099'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('togglePin', () => {
    it('should toggle isPinned from false to true', async () => {
      const entry = { ...mockEntry, isPinned: false };
      diaryRepo.findOne.mockResolvedValue(entry);
      diaryRepo.save.mockResolvedValue({ ...entry, isPinned: true });

      const result = await service.togglePin(mockEntry.id);

      expect(result).toEqual({ isPinned: true });
    });

    it('should toggle isPinned from true to false', async () => {
      const entry = { ...mockEntry, isPinned: true };
      diaryRepo.findOne.mockResolvedValue(entry);
      diaryRepo.save.mockResolvedValue({ ...entry, isPinned: false });

      const result = await service.togglePin(mockEntry.id);

      expect(result).toEqual({ isPinned: false });
    });
  });

  describe('toggleBookmark', () => {
    it('should toggle isBookmarked from false to true', async () => {
      const entry = { ...mockEntry, isBookmarked: false };
      diaryRepo.findOne.mockResolvedValue(entry);
      diaryRepo.save.mockResolvedValue({ ...entry, isBookmarked: true });

      const result = await service.toggleBookmark(mockEntry.id);

      expect(result).toEqual({ isBookmarked: true });
    });

    it('should toggle isBookmarked from true to false', async () => {
      const entry = { ...mockEntry, isBookmarked: true };
      diaryRepo.findOne.mockResolvedValue(entry);
      diaryRepo.save.mockResolvedValue({ ...entry, isBookmarked: false });

      const result = await service.toggleBookmark(mockEntry.id);

      expect(result).toEqual({ isBookmarked: false });
    });
  });
});
