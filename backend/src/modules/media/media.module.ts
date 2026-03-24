import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Media } from '../diary/entities/media.entity';
import { LocalDiskProvider } from './storage/local-disk.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  controllers: [MediaController],
  providers: [MediaService, LocalDiskProvider],
  exports: [MediaService],
})
export class MediaModule {}
