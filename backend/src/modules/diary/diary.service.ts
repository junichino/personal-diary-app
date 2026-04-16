import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { DiaryEntry } from './entities/diary-entry.entity';
import { DiaryTag } from './entities/diary-tag.entity';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { DiaryQueryDto } from './dto/diary-query.dto';
import { MediaService } from '../media/media.service';
import { PaginationMeta } from '../../common/interceptors/response-transform.interceptor';

@Injectable()
export class DiaryService {
  constructor(
    @InjectRepository(DiaryEntry)
    private diaryRepository: Repository<DiaryEntry>,
    @InjectRepository(DiaryTag)
    private diaryTagRepository: Repository<DiaryTag>,
    private mediaService: MediaService,
  ) {}

  async findAll(
    query: DiaryQueryDto,
  ): Promise<{ data: DiaryEntry[]; meta: PaginationMeta }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'entryDate',
      sortOrder = 'DESC',
      mood,
      tag,
      startDate,
      endDate,
      search,
      isBookmarked,
      isPinned,
    } = query;

    const qb: SelectQueryBuilder<DiaryEntry> = this.diaryRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.diaryTags', 'diaryTag')
      .leftJoinAndSelect('diaryTag.tag', 'tag')
      .leftJoinAndSelect('entry.media', 'media');

    if (mood) {
      qb.andWhere('entry.mood = :mood', { mood });
    }

    if (tag) {
      qb.andWhere('tag.name = :tagName', { tagName: tag });
    }

    if (startDate) {
      qb.andWhere('entry.entryDate >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('entry.entryDate <= :endDate', { endDate });
    }

    if (search) {
      const escaped = search.replace(/[%_]/g, '\\$&');
      qb.andWhere('entry.content LIKE :search ESCAPE "\\"', { search: `%${escaped}%` });
    }

    if (isBookmarked !== undefined) {
      qb.andWhere('entry.isBookmarked = :isBookmarked', { isBookmarked });
    }

    if (isPinned !== undefined) {
      qb.andWhere('entry.isPinned = :isPinned', { isPinned });
    }

    // Pinned entries first, then sort by specified field
    const allowedSortFields: Record<string, string> = {
      entryDate: 'entry.entryDate',
      entryTime: 'entry.entryTime',
      createdAt: 'entry.createdAt',
      updatedAt: 'entry.updatedAt',
      mood: 'entry.mood',
    };

    const sortField = allowedSortFields[sortBy] ?? 'entry.entryDate';

    qb.orderBy('entry.isPinned', 'DESC')
      .addOrderBy(sortField, sortOrder)
      .addOrderBy('entry.entryTime', 'DESC');

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<DiaryEntry> {
    const entry = await this.diaryRepository.findOne({
      where: { id },
      relations: ['media', 'diaryTags', 'diaryTags.tag'],
      order: { media: { sortOrder: 'ASC' } },
    });

    if (!entry) {
      throw new NotFoundException('Diary entry not found');
    }

    return entry;
  }

  async create(
    dto: CreateDiaryDto,
    files?: Express.Multer.File[],
  ): Promise<DiaryEntry> {
    const now = new Date();
    const entry = this.diaryRepository.create({
      content: dto.content,
      mood: dto.mood ?? null,
      moodScore: dto.moodScore ?? null,
      location: dto.location ?? null,
      weather: dto.weather ?? null,
      temperature: dto.temperature ?? null,
      entryDate: dto.entryDate ?? now.toISOString().split('T')[0],
      entryTime: dto.entryTime ?? now.toTimeString().split(' ')[0],
      isPinned: false,
      isBookmarked: false,
    });

    const savedEntry = await this.diaryRepository.save(entry);

    // Handle tags
    if (dto.tagIds && dto.tagIds.length > 0) {
      const diaryTags = dto.tagIds.map((tagId) =>
        this.diaryTagRepository.create({
          diaryEntryId: savedEntry.id,
          tagId,
        }),
      );
      await this.diaryTagRepository.save(diaryTags);
    }

    // Handle file uploads
    if (files && files.length > 0) {
      await this.mediaService.uploadFiles(savedEntry.id, files);
    }

    return this.findOne(savedEntry.id);
  }

  async update(
    id: string,
    dto: UpdateDiaryDto,
    files?: Express.Multer.File[],
  ): Promise<DiaryEntry> {
    const entry = await this.findOne(id);

    if (dto.content !== undefined) entry.content = dto.content;
    if (dto.mood !== undefined) entry.mood = dto.mood ?? null;
    if (dto.moodScore !== undefined) entry.moodScore = dto.moodScore ?? null;
    if (dto.location !== undefined) entry.location = dto.location ?? null;
    if (dto.weather !== undefined) entry.weather = dto.weather ?? null;
    if (dto.temperature !== undefined)
      entry.temperature = dto.temperature ?? null;
    if (dto.entryDate !== undefined) entry.entryDate = dto.entryDate;
    if (dto.entryTime !== undefined) entry.entryTime = dto.entryTime;
    if (dto.isPinned !== undefined) entry.isPinned = dto.isPinned;
    if (dto.isBookmarked !== undefined) entry.isBookmarked = dto.isBookmarked;

    await this.diaryRepository.save(entry);

    // Handle tags replacement
    if (dto.tagIds !== undefined) {
      await this.diaryTagRepository.delete({ diaryEntryId: id });
      if (dto.tagIds.length > 0) {
        const diaryTags = dto.tagIds.map((tagId) =>
          this.diaryTagRepository.create({
            diaryEntryId: id,
            tagId,
          }),
        );
        await this.diaryTagRepository.save(diaryTags);
      }
    }

    // Handle media removal
    if (dto.removeMediaIds && dto.removeMediaIds.length > 0) {
      for (const mediaId of dto.removeMediaIds) {
        await this.mediaService.deleteFile(mediaId);
      }
    }

    // Handle new file uploads
    if (files && files.length > 0) {
      await this.mediaService.uploadFiles(id, files);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const entry = await this.findOne(id);
    await this.diaryRepository.softRemove(entry);
    return { message: 'Diary entry deleted' };
  }

  async togglePin(id: string): Promise<{ isPinned: boolean }> {
    const entry = await this.findOne(id);
    entry.isPinned = !entry.isPinned;
    await this.diaryRepository.save(entry);
    return { isPinned: entry.isPinned };
  }

  async toggleBookmark(id: string): Promise<{ isBookmarked: boolean }> {
    const entry = await this.findOne(id);
    entry.isBookmarked = !entry.isBookmarked;
    await this.diaryRepository.save(entry);
    return { isBookmarked: entry.isBookmarked };
  }
}
