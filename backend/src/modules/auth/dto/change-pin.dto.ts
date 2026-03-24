import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePinDto {
  @ApiProperty({ description: 'PIN ปัจจุบัน 6 หลัก', example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Current PIN must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Current PIN must contain only digits' })
  currentPin: string;

  @ApiProperty({ description: 'PIN ใหม่ 6 หลัก', example: '654321' })
  @IsString()
  @Length(6, 6, { message: 'New PIN must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'New PIN must contain only digits' })
  newPin: string;
}
