import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Mood } from '../entities/diary-entry.entity';

export class DiaryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: Mood, description: 'Filter by mood' })
  @IsOptional()
  @IsEnum(Mood)
  mood?: string;

  @ApiPropertyOptional({ description: 'Filter by tag name' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Start date (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search in content' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter bookmarked only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isBookmarked?: boolean;

  @ApiPropertyOptional({ description: 'Filter pinned only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPinned?: boolean;
}
