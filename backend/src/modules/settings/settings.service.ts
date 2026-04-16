import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './entities/app-setting.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export interface SettingsResponse {
  id: number;
  appName: string;
  timezone: string;
  darkMode: boolean;
  autoLockMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private appSettingRepository: Repository<AppSetting>,
  ) {}

  async getSettings(): Promise<SettingsResponse> {
    const setting = await this.appSettingRepository.findOne({
      where: { id: 1 },
    });
    if (!setting) {
      throw new NotFoundException(
        'Settings not found. Please setup PIN first.',
      );
    }

    return {
      id: setting.id,
      appName: setting.appName,
      timezone: setting.timezone,
      darkMode: setting.darkMode,
      autoLockMinutes: setting.autoLockMinutes,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    };
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<SettingsResponse> {
    const setting = await this.appSettingRepository.findOne({
      where: { id: 1 },
    });
    if (!setting) {
      throw new NotFoundException(
        'Settings not found. Please setup PIN first.',
      );
    }

    if (dto.appName !== undefined) setting.appName = dto.appName;
    if (dto.timezone !== undefined) setting.timezone = dto.timezone;
    if (dto.darkMode !== undefined) setting.darkMode = dto.darkMode;
    if (dto.autoLockMinutes !== undefined)
      setting.autoLockMinutes = dto.autoLockMinutes;

    const updated = await this.appSettingRepository.save(setting);

    return {
      id: updated.id,
      appName: updated.appName,
      timezone: updated.timezone,
      darkMode: updated.darkMode,
      autoLockMinutes: updated.autoLockMinutes,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
