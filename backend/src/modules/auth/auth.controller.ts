import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import * as express from 'express';
import { AuthService } from './auth.service';
import { SetupPinDto } from './dto/setup-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { ChangePinDto } from './dto/change-pin.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Setup PIN for first time' })
  @ApiResponse({ status: 201, description: 'PIN setup completed' })
  @ApiResponse({ status: 409, description: 'PIN already set up' })
  async setup(
    @Body() dto: SetupPinDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<{ message: string }> {
    const ipAddress = (req.ip ?? req.socket.remoteAddress) ?? null;
    const userAgent = (req.headers['user-agent'] as string) ?? null;
    const result = await this.authService.setup(dto.pin, ipAddress, userAgent);

    const status = await this.authService.verifyPin(dto.pin, ipAddress, userAgent);
    res.cookie('session_token', status.token, this.authService.getCookieOptions());

    return result;
  }

  @Public()
  @Post('verify-pin')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Verify PIN and create session' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid PIN' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async verifyPin(
    @Body() dto: VerifyPinDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<{ message: string }> {
    const ipAddress = (req.ip ?? req.socket.remoteAddress) ?? null;
    const userAgent = (req.headers['user-agent'] as string) ?? null;
    const result = await this.authService.verifyPin(dto.pin, ipAddress, userAgent);

    res.cookie('session_token', result.token, this.authService.getCookieOptions());

    return { message: result.message };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('session_token')
  @ApiOperation({ summary: 'Logout and clear session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<{ message: string }> {
    const token = req.cookies?.['session_token'] as string;
    const result = await this.authService.logout(token);
    res.clearCookie('session_token', { path: '/' });
    return result;
  }

  @Patch('change-pin')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('session_token')
  @ApiOperation({ summary: 'Change PIN' })
  @ApiResponse({ status: 200, description: 'PIN changed successfully' })
  @ApiResponse({ status: 401, description: 'Current PIN is incorrect' })
  async changePin(@Body() dto: ChangePinDto): Promise<{ message: string }> {
    return this.authService.changePin(dto.currentPin, dto.newPin);
  }

  @Public()
  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check setup and auth status' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  async getStatus(
    @Req() req: express.Request,
  ): Promise<{ isSetup: boolean; isAuthenticated: boolean }> {
    const token = req.cookies?.['session_token'] as string | undefined;
    return this.authService.getStatus(token);
  }
}
