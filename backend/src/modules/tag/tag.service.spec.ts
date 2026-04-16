import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TagService } from './tag.service';
import { Tag } from './entities/tag.entity';
import { DiaryTag } from '../diary/entities/diary-tag.entity';

describe('TagService', () => {
  let service: TagService;
  let tagRepo: jest.Mocked<Repository<Tag>>;
  let diaryTagRepo: jest.Mocked<Repository<DiaryTag>>;

  const mockTag: Tag = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'travel',
    color: '#3498DB',
    createdAt: new Date('2026-04-16'),
    diaryTags: [],
  };

  const createMockQueryBuilder = () => ({
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn().mockResolvedValue({
      entities: [mockTag],
      raw: [{ entryCount: '3' }],
    }),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: getRepositoryToken(Tag),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DiaryTag),
          useValue: {
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
    tagRepo = module.get(getRepositoryToken(Tag));
    diaryTagRepo = module.get(getRepositoryToken(DiaryTag));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all tags with entry counts', async () => {
      const qb = createMockQueryBuilder();
      tagRepo.createQueryBuilder.mockReturnValue(qb as unknown as ReturnType<Repository<Tag>['createQueryBuilder']>);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: mockTag.id,
          name: 'travel',
          color: '#3498DB',
          entryCount: 3,
        }),
      );
    });

    it('should return empty array when no tags', async () => {
      const qb = createMockQueryBuilder();
      qb.getRawAndEntities.mockResolvedValue({ entities: [], raw: [] });
      tagRepo.createQueryBuilder.mockReturnValue(qb as unknown as ReturnType<Repository<Tag>['createQueryBuilder']>);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create tag with name and default color', async () => {
      tagRepo.findOne.mockResolvedValue(null);
      tagRepo.create.mockReturnValue(mockTag);
      tagRepo.save.mockResolvedValue(mockTag);

      const result = await service.create({ name: 'travel' });

      expect(result).toEqual(mockTag);
      expect(tagRepo.create).toHaveBeenCalledWith({
        name: 'travel',
        color: '#3498DB',
      });
    });

    it('should create tag with custom color', async () => {
      const customTag = { ...mockTag, color: '#2ECC71' };
      tagRepo.findOne.mockResolvedValue(null);
      tagRepo.create.mockReturnValue(customTag);
      tagRepo.save.mockResolvedValue(customTag);

      const result = await service.create({
        name: 'travel',
        color: '#2ECC71',
      });

      expect(result.color).toBe('#2ECC71');
    });

    it('should throw ConflictException when tag name already exists', async () => {
      tagRepo.findOne.mockResolvedValue(mockTag);

      await expect(
        service.create({ name: 'travel' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update tag name', async () => {
      const updatedTag = { ...mockTag, name: 'food' };
      tagRepo.findOne
        .mockResolvedValueOnce({ ...mockTag }) // find existing
        .mockResolvedValueOnce(null); // check duplicate name
      tagRepo.save.mockResolvedValue(updatedTag);

      const result = await service.update(mockTag.id, { name: 'food' });

      expect(result.name).toBe('food');
    });

    it('should update tag color', async () => {
      const updatedTag = { ...mockTag, color: '#E74C3C' };
      tagRepo.findOne.mockResolvedValueOnce(mockTag);
      tagRepo.save.mockResolvedValue(updatedTag);

      const result = await service.update(mockTag.id, { color: '#E74C3C' });

      expect(result.color).toBe('#E74C3C');
    });

    it('should throw NotFoundException when tag not found', async () => {
      tagRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('550e8400-e29b-41d4-a716-446655440099', {
          name: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to existing name', async () => {
      const anotherTag = {
        ...mockTag,
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'food',
      };
      tagRepo.findOne
        .mockResolvedValueOnce({ ...mockTag }) // find existing (name='travel')
        .mockResolvedValueOnce(anotherTag); // check duplicate: 'food' exists

      await expect(
        service.update(mockTag.id, { name: 'food' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not check duplicate when name unchanged', async () => {
      tagRepo.findOne.mockResolvedValueOnce({ ...mockTag });
      tagRepo.save.mockResolvedValue(mockTag);

      await service.update(mockTag.id, { name: 'travel' });

      // findOne called once to find existing tag, not again for duplicate check
      expect(tagRepo.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove tag and its associations', async () => {
      tagRepo.findOne.mockResolvedValue(mockTag);
      diaryTagRepo.delete.mockResolvedValue({ affected: 2, raw: [] });
      tagRepo.remove.mockResolvedValue(mockTag);

      const result = await service.remove(mockTag.id);

      expect(result).toEqual({ message: 'Tag deleted' });
      expect(diaryTagRepo.delete).toHaveBeenCalledWith({
        tagId: mockTag.id,
      });
      expect(tagRepo.remove).toHaveBeenCalledWith(mockTag);
    });

    it('should throw NotFoundException when tag not found', async () => {
      tagRepo.findOne.mockResolvedValue(null);

      await expect(
        service.remove('550e8400-e29b-41d4-a716-446655440099'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
