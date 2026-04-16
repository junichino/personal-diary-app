import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Session } from './entities/session.entity';
import { AppSetting } from '../settings/entities/app-setting.entity';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let sessionRepo: jest.Mocked<Repository<Session>>;
  let appSettingRepo: jest.Mocked<Repository<AppSetting>>;
  let configService: jest.Mocked<ConfigService>;

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

  const mockSession: Session = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    token: 'mock-token-hex-string',
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AppSetting),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    sessionRepo = module.get(getRepositoryToken(Session));
    appSettingRepo = module.get(getRepositoryToken(AppSetting));
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('should setup PIN when no existing setting', async () => {
      appSettingRepo.findOne.mockResolvedValue(null);
      appSettingRepo.create.mockReturnValue(mockSetting);
      appSettingRepo.save.mockResolvedValue(mockSetting);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashedpin');
      configService.get.mockReturnValue(12);
      sessionRepo.create.mockReturnValue(mockSession);
      sessionRepo.save.mockResolvedValue(mockSession);

      const result = await service.setup('123456', '127.0.0.1', 'test-agent');

      expect(result).toEqual({ message: 'PIN setup completed' });
      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 12);
      expect(appSettingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          pinHash: '$2b$12$hashedpin',
          appName: 'My Diary',
        }),
      );
      expect(appSettingRepo.save).toHaveBeenCalled();
      expect(sessionRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when PIN already set up', async () => {
      appSettingRepo.findOne.mockResolvedValue(mockSetting);

      await expect(
        service.setup('123456', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyPin', () => {
    it('should verify PIN and return token on success', async () => {
      appSettingRepo.findOne.mockResolvedValue(mockSetting);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      configService.get.mockReturnValue(72);
      sessionRepo.create.mockReturnValue(mockSession);
      sessionRepo.save.mockResolvedValue(mockSession);

      const result = await service.verifyPin(
        '123456',
        '127.0.0.1',
        'test-agent',
      );

      expect(result.message).toBe('Authenticated successfully');
      expect(result.token).toBeDefined();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        '123456',
        mockSetting.pinHash,
      );
    });

    it('should throw UnauthorizedException when PIN not set up', async () => {
      appSettingRepo.findOne.mockResolvedValue(null);

      await expect(
        service.verifyPin('123456', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when PIN is invalid', async () => {
      appSettingRepo.findOne.mockResolvedValue(mockSetting);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.verifyPin('999999', '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete session by token', async () => {
      sessionRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      const result = await service.logout('mock-token');

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(sessionRepo.delete).toHaveBeenCalledWith({
        token: 'mock-token',
      });
    });
  });

  describe('changePin', () => {
    it('should change PIN when current PIN is correct', async () => {
      appSettingRepo.findOne.mockResolvedValue({ ...mockSetting });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhashedpin');
      configService.get.mockReturnValue(12);
      appSettingRepo.save.mockResolvedValue({
        ...mockSetting,
        pinHash: '$2b$12$newhashedpin',
      });

      const result = await service.changePin('123456', '654321');

      expect(result).toEqual({ message: 'PIN changed successfully' });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        '123456',
        mockSetting.pinHash,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('654321', 12);
    });

    it('should throw UnauthorizedException when PIN not set up', async () => {
      appSettingRepo.findOne.mockResolvedValue(null);

      await expect(service.changePin('123456', '654321')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when current PIN is incorrect', async () => {
      appSettingRepo.findOne.mockResolvedValue(mockSetting);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePin('999999', '654321')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getStatus', () => {
    it('should return isSetup=true and isAuthenticated=true when session valid', async () => {
      appSettingRepo.findOne.mockResolvedValue(mockSetting);
      sessionRepo.findOne.mockResolvedValue(mockSession);

      const result = await service.getStatus('valid-token');

      expect(result).toEqual({ isSetup: true, isAuthenticated: true });
    });

    it('should return isSetup=true and isAuthenticated=false when no token', async () => {
      appSettingRepo.findOne.mockResolvedValue(mockSetting);

      const result = await service.getStatus(undefined);

      expect(result).toEqual({ isSetup: true, isAuthenticated: false });
    });

    it('should return isSetup=false when no setting exists', async () => {
      appSettingRepo.findOne.mockResolvedValue(null);

      const result = await service.getStatus(undefined);

      expect(result).toEqual({ isSetup: false, isAuthenticated: false });
    });

    it('should return isAuthenticated=false when session expired/not found', async () => {
      appSettingRepo.findOne.mockResolvedValue(mockSetting);
      sessionRepo.findOne.mockResolvedValue(null);

      const result = await service.getStatus('expired-token');

      expect(result).toEqual({ isSetup: true, isAuthenticated: false });
    });
  });

  describe('getCookieOptions', () => {
    it('should return httpOnly cookie options with correct maxAge', () => {
      configService.get.mockReturnValue(72);

      const options = service.getCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('lax');
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(72 * 60 * 60 * 1000);
    });

    it('should set secure=true in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      configService.get.mockReturnValue(72);

      const options = service.getCookieOptions();

      expect(options.secure).toBe(true);
      process.env.NODE_ENV = originalEnv;
    });

    it('should set secure=false in non-production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      configService.get.mockReturnValue(72);

      const options = service.getCookieOptions();

      expect(options.secure).toBe(false);
      process.env.NODE_ENV = originalEnv;
    });
  });
});
