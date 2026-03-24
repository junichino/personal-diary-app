import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { DiaryEntry } from './entities/diary-entry.entity';
import { DiaryTag } from './entities/diary-tag.entity';
import { Media } from './entities/media.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiaryEntry, DiaryTag, Media]),
    MediaModule,
  ],
  controllers: [DiaryController],
  providers: [DiaryService],
  exports: [DiaryService],
})
export class DiaryModule {}
