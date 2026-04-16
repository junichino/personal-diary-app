import { IsString, Length, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ description: 'ชื่อ Tag', example: 'ท่องเที่ยว' })
  @IsString()
  @Length(1, 50)
  name: string;

  @ApiPropertyOptional({ description: 'สี Hex code', example: '#3498DB' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a valid hex color (e.g., #3498DB)',
  })
  color?: string;
}
