import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsUUID,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Mood } from '../entities/diary-entry.entity';

export class CreateDiaryDto {
  @ApiProperty({ description: 'เนื้อหาไดอารี่' })
  @IsString()
  @Length(1, 50000)
  content: string;

  @ApiPropertyOptional({ enum: Mood, description: 'อารมณ์' })
  @IsOptional()
  @IsEnum(Mood)
  mood?: string;

  @ApiPropertyOptional({
    description: 'คะแนนอารมณ์ 1-5',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  moodScore?: number;

  @ApiPropertyOptional({ description: 'สถานที่' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  location?: string;

  @ApiPropertyOptional({ description: 'สภาพอากาศ' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  weather?: string;

  @ApiPropertyOptional({ description: 'อุณหภูมิ °C' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({
    description: 'วันที่ (YYYY-MM-DD)',
    example: '2026-03-24',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'entryDate must be in YYYY-MM-DD format',
  })
  entryDate?: string;

  @ApiPropertyOptional({ description: 'เวลา (HH:mm:ss)', example: '14:30:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/, {
    message: 'entryTime must be in HH:mm:ss format',
  })
  entryTime?: string;

  @ApiPropertyOptional({ description: 'Tag IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
