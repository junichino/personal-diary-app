import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { Tag } from './entities/tag.entity';
import { DiaryTag } from '../diary/entities/diary-tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, DiaryTag])],
  controllers: [TagController],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
