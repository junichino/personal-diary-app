import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { DiaryTag } from '../diary/entities/diary-tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

export interface TagWithCount {
  id: string;
  name: string;
  color: string;
  entryCount: number;
  createdAt: Date;
}

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(DiaryTag)
    private diaryTagRepository: Repository<DiaryTag>,
  ) {}

  async findAll(): Promise<TagWithCount[]> {
    const tags = await this.tagRepository
      .createQueryBuilder('tag')
      .leftJoin('tag.diaryTags', 'diaryTag')
      .addSelect('COUNT(diaryTag.diaryEntryId)', 'entryCount')
      .groupBy('tag.id')
      .orderBy('tag.name', 'ASC')
      .getRawAndEntities();

    return tags.entities.map((tag, index) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      entryCount: parseInt(tags.raw[index]?.['entryCount'] ?? '0', 10),
      createdAt: tag.createdAt,
    }));
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    const existing = await this.tagRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Tag "${dto.name}" already exists`);
    }

    const tag = this.tagRepository.create({
      name: dto.name,
      color: dto.color ?? '#3498DB',
    });

    return this.tagRepository.save(tag);
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (dto.name !== undefined && dto.name !== tag.name) {
      const existing = await this.tagRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Tag "${dto.name}" already exists`);
      }
      tag.name = dto.name;
    }

    if (dto.color !== undefined) {
      tag.color = dto.color;
    }

    return this.tagRepository.save(tag);
  }

  async remove(id: string): Promise<{ message: string }> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Remove tag associations from diary entries
    await this.diaryTagRepository.delete({ tagId: id });

    // Remove tag
    await this.tagRepository.remove(tag);

    return { message: 'Tag deleted' };
  }
}
