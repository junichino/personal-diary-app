import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SettingsService } from './settings.service';
import { AppSetting } from './entities/app-setting.entity';

describe('SettingsService', () => {
  let service: SettingsService;
  let appSettingRepo: jest.Mocked<Repository<AppSetting>>;

  const mockSetting: AppSetting = {
    id: 1,
    pinHash: '$2b$12$hashedpin',
    appName: 'My Diary',
    timezone: 'Asia/Bangkok',
    darkMode: false,
    autoLockMinutes: 5,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(AppSetting),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    appSettingRepo = module.get(getRepositoryToken(AppSetting));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return settings without pinHash', async () => {
      appSettingRepo.findOne.mockResolvedValue(mockSetting);

      const result = await service.getSettings();

      expect(result).toEqual({
        id: 1,
        appName: 'My Diary',
        timezone: 'Asia/Bangkok',
        darkMode: false,
        autoLockMinutes: 5,
        createdAt: mockSetting.createdAt,
        updatedAt: mockSetting.updatedAt,
      });
      // pinHash should NOT be in the response
      expect(result).not.toHaveProperty('pinHash');
    });

    it('should throw NotFoundException when settings not found', async () => {
      appSettingRepo.findOne.mockResolvedValue(null);

      await expect(service.getSettings()).rejects.toThrow(NotFoundException);
    });

    it('should always query with id=1 (singleton)', async () => {
      appSettingRepo.findOne.mockResolvedValue(mockSetting);

      await service.getSettings();

      expect(appSettingRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('updateSettings', () => {
    it('should update appName', async () => {
      const updatedSetting = { ...mockSetting, appName: 'บันทึกส่วนตัว' };
      appSettingRepo.findOne.mockResolvedValue({ ...mockSetting });
      appSettingRepo.save.mockResolvedValue(updatedSetting);

      const result = await service.updateSettings({
        appName: 'บันทึกส่วนตัว',
      });

      expect(result.appName).toBe('บันทึกส่วนตัว');
    });

    it('should update timezone', async () => {
      const updatedSetting = { ...mockSetting, timezone: 'UTC' };
      appSettingRepo.findOne.mockResolvedValue({ ...mockSetting });
      appSettingRepo.save.mockResolvedValue(updatedSetting);

      const result = await service.updateSettings({ timezone: 'UTC' });

      expect(result.timezone).toBe('UTC');
    });

    it('should update darkMode', async () => {
      const updatedSetting = { ...mockSetting, darkMode: true };
      appSettingRepo.findOne.mockResolvedValue({ ...mockSetting });
      appSettingRepo.save.mockResolvedValue(updatedSetting);

      const result = await service.updateSettings({ darkMode: true });

      expect(result.darkMode).toBe(true);
    });

    it('should update autoLockMinutes', async () => {
      const updatedSetting = { ...mockSetting, autoLockMinutes: 15 };
      appSettingRepo.findOne.mockResolvedValue({ ...mockSetting });
      appSettingRepo.save.mockResolvedValue(updatedSetting);

      const result = await service.updateSettings({ autoLockMinutes: 15 });

      expect(result.autoLockMinutes).toBe(15);
    });

    it('should update multiple fields at once', async () => {
      const updatedSetting = {
        ...mockSetting,
        appName: 'New Name',
        darkMode: true,
        autoLockMinutes: 10,
      };
      appSettingRepo.findOne.mockResolvedValue({ ...mockSetting });
      appSettingRepo.save.mockResolvedValue(updatedSetting);

      const result = await service.updateSettings({
        appName: 'New Name',
        darkMode: true,
        autoLockMinutes: 10,
      });

      expect(result.appName).toBe('New Name');
      expect(result.darkMode).toBe(true);
      expect(result.autoLockMinutes).toBe(10);
    });

    it('should throw NotFoundException when settings not found', async () => {
      appSettingRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateSettings({ appName: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not modify fields when not provided in DTO', async () => {
      const setting = { ...mockSetting };
      appSettingRepo.findOne.mockResolvedValue(setting);
      appSettingRepo.save.mockResolvedValue(setting);

      await service.updateSettings({});

      // The saved setting should retain original values
      expect(appSettingRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          appName: 'My Diary',
          timezone: 'Asia/Bangkok',
          darkMode: false,
          autoLockMinutes: 5,
        }),
      );
    });

    it('should not expose pinHash in response', async () => {
      appSettingRepo.findOne.mockResolvedValue({ ...mockSetting });
      appSettingRepo.save.mockResolvedValue(mockSetting);

      const result = await service.updateSettings({ appName: 'test' });

      expect(result).not.toHaveProperty('pinHash');
    });
  });
});
