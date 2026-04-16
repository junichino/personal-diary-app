import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockCookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 72 * 60 * 60 * 1000,
  };

  const mockReq = (overrides: Record<string, unknown> = {}) =>
    ({
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'user-agent': 'test-agent' },
      cookies: { session_token: 'mock-token' },
      ...overrides,
    }) as unknown as import('express').Request;

  const mockRes = () => {
    const res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as import('express').Response;
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            setup: jest.fn(),
            verifyPin: jest.fn(),
            logout: jest.fn(),
            changePin: jest.fn(),
            getStatus: jest.fn(),
            getCookieOptions: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('should call authService.setup and set session cookie', async () => {
      authService.setup.mockResolvedValue({ message: 'PIN setup completed' });
      authService.verifyPin.mockResolvedValue({
        message: 'Authenticated successfully',
        token: 'new-session-token',
      });
      authService.getCookieOptions.mockReturnValue(mockCookieOptions);

      const req = mockReq();
      const res = mockRes();

      const result = await controller.setup({ pin: '123456' }, req, res);

      expect(result).toEqual({ message: 'PIN setup completed' });
      expect(authService.setup).toHaveBeenCalledWith(
        '123456',
        '127.0.0.1',
        'test-agent',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'session_token',
        'new-session-token',
        mockCookieOptions,
      );
    });
  });

  describe('verifyPin', () => {
    it('should verify PIN and set session cookie', async () => {
      authService.verifyPin.mockResolvedValue({
        message: 'Authenticated successfully',
        token: 'session-token-123',
      });
      authService.getCookieOptions.mockReturnValue(mockCookieOptions);

      const req = mockReq();
      const res = mockRes();

      const result = await controller.verifyPin({ pin: '123456' }, req, res);

      expect(result).toEqual({ message: 'Authenticated successfully' });
      expect(res.cookie).toHaveBeenCalledWith(
        'session_token',
        'session-token-123',
        mockCookieOptions,
      );
    });
  });

  describe('logout', () => {
    it('should call authService.logout and clear cookie', async () => {
      authService.logout.mockResolvedValue({
        message: 'Logged out successfully',
      });

      const req = mockReq();
      const res = mockRes();

      const result = await controller.logout(req, res);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(authService.logout).toHaveBeenCalledWith('mock-token');
      expect(res.clearCookie).toHaveBeenCalledWith('session_token', {
        path: '/',
      });
    });
  });

  describe('changePin', () => {
    it('should delegate to authService.changePin', async () => {
      authService.changePin.mockResolvedValue({
        message: 'PIN changed successfully',
      });

      const result = await controller.changePin({
        currentPin: '123456',
        newPin: '654321',
      });

      expect(result).toEqual({ message: 'PIN changed successfully' });
      expect(authService.changePin).toHaveBeenCalledWith('123456', '654321');
    });
  });

  describe('getStatus', () => {
    it('should return status from authService', async () => {
      authService.getStatus.mockResolvedValue({
        isSetup: true,
        isAuthenticated: true,
      });

      const req = mockReq();
      const result = await controller.getStatus(req);

      expect(result).toEqual({ isSetup: true, isAuthenticated: true });
      expect(authService.getStatus).toHaveBeenCalledWith('mock-token');
    });

    it('should pass undefined when no cookie present', async () => {
      authService.getStatus.mockResolvedValue({
        isSetup: false,
        isAuthenticated: false,
      });

      const req = mockReq({ cookies: {} });
      const result = await controller.getStatus(req);

      expect(result).toEqual({ isSetup: false, isAuthenticated: false });
      expect(authService.getStatus).toHaveBeenCalledWith(undefined);
    });
  });
});
