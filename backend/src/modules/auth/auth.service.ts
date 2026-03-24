import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Session } from './entities/session.entity';
import { AppSetting } from '../settings/entities/app-setting.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(AppSetting)
    private appSettingRepository: Repository<AppSetting>,
    private configService: ConfigService,
  ) {}

  async setup(
    pin: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ message: string }> {
    const existing = await this.appSettingRepository.findOne({ where: { id: 1 } });
    if (existing) {
      throw new ConflictException('PIN has already been set up');
    }

    const saltRounds = this.configService.get<number>('pin.saltRounds', 12);
    const pinHash = await bcrypt.hash(pin, saltRounds);

    const setting = this.appSettingRepository.create({
      pinHash,
      appName: 'My Diary',
      timezone: 'Asia/Bangkok',
      darkMode: false,
      autoLockMinutes: 5,
    });
    await this.appSettingRepository.save(setting);

    await this.createSession(ipAddress, userAgent);

    return { message: 'PIN setup completed' };
  }

  async verifyPin(
    pin: string,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ message: string; token: string }> {
    const setting = await this.appSettingRepository.findOne({ where: { id: 1 } });
    if (!setting) {
      throw new UnauthorizedException('PIN has not been set up yet');
    }

    const isValid = await bcrypt.compare(pin, setting.pinHash);
    if (!isValid) {
      throw new UnauthorizedException({
        code: 'INVALID_PIN',
        message: 'Invalid PIN',
      });
    }

    const session = await this.createSession(ipAddress, userAgent);

    return { message: 'Authenticated successfully', token: session.token };
  }

  async logout(token: string): Promise<{ message: string }> {
    await this.sessionRepository.delete({ token });
    return { message: 'Logged out successfully' };
  }

  async changePin(
    currentPin: string,
    newPin: string,
  ): Promise<{ message: string }> {
    const setting = await this.appSettingRepository.findOne({ where: { id: 1 } });
    if (!setting) {
      throw new UnauthorizedException('PIN has not been set up yet');
    }

    const isValid = await bcrypt.compare(currentPin, setting.pinHash);
    if (!isValid) {
      throw new UnauthorizedException({
        code: 'INVALID_PIN',
        message: 'Current PIN is incorrect',
      });
    }

    const saltRounds = this.configService.get<number>('pin.saltRounds', 12);
    setting.pinHash = await bcrypt.hash(newPin, saltRounds);
    await this.appSettingRepository.save(setting);

    return { message: 'PIN changed successfully' };
  }

  async getStatus(
    token: string | undefined,
  ): Promise<{ isSetup: boolean; isAuthenticated: boolean }> {
    const setting = await this.appSettingRepository.findOne({ where: { id: 1 } });
    const isSetup = !!setting;

    let isAuthenticated = false;
    if (token) {
      const session = await this.sessionRepository.findOne({
        where: {
          token,
          expiresAt: MoreThan(new Date()),
        },
      });
      isAuthenticated = !!session;
    }

    return { isSetup, isAuthenticated };
  }

  private async createSession(
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<Session> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiryHours = this.configService.get<number>('session.expiryHours', 72);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    const session = this.sessionRepository.create({
      token,
      expiresAt,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    return this.sessionRepository.save(session);
  }

  getCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    path: string;
    maxAge: number;
  } {
    const expiryHours = this.configService.get<number>('session.expiryHours', 72);
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiryHours * 60 * 60 * 1000,
    };
  }
}
