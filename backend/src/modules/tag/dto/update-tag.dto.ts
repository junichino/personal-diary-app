import { IsString, IsOptional, Length, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTagDto {
  @ApiPropertyOptional({ description: 'ชื่อ Tag', example: 'ท่องเที่ยว' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @ApiPropertyOptional({ description: 'สี Hex code', example: '#2ECC71' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a valid hex color (e.g., #3498DB)',
  })
  color?: string;
}
