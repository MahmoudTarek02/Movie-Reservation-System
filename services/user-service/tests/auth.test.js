// Set test environment variables before requiring the app
process.env.NODE_ENV = 'test';
process.env.DATABASE = 'mongodb://127.0.0.1:27017/user-service-test';
process.env.JWT_SECRET = 'my-super-secret-test-key-at-least-32-characters-long';
process.env.CLIENT_URL = 'http://localhost:5173';

const request = require('supertest');
const app = require('../src/app');

// Mock Repositories
const userRepository = require('../src/repositories/userRepository');
const refreshTokenRepository = require('../src/repositories/refreshTokenRepository');
const passwordResetTokenRepository = require('../src/repositories/passwordResetTokenRepository');
const emailVerificationTokenRepository = require('../src/repositories/emailVerificationTokenRepository');
const securityRepository = require('../src/repositories/securityRepository');

// Mock Utilities
const sendEmail = require('../src/utils/email');
const writeAuditLog = require('../src/utils/auditLogger');
const bcrypt = require('bcryptjs');

jest.mock('../src/repositories/userRepository');
jest.mock('../src/repositories/refreshTokenRepository');
jest.mock('../src/repositories/passwordResetTokenRepository');
jest.mock('../src/repositories/emailVerificationTokenRepository');
jest.mock('../src/repositories/securityRepository');
jest.mock('../src/utils/email');
jest.mock('../src/utils/auditLogger');
jest.mock('bcryptjs');

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default bcrypt mock behaviors
    bcrypt.hash.mockResolvedValue('mockedHashedPassword');
    bcrypt.compare.mockResolvedValue(true);
  });

  describe('POST /api/v1/users/register', () => {
    it('should successfully register a new user and return tokens', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        isVerified: false
      };

      userRepository.findActiveByEmail.mockResolvedValue(null);
      userRepository.createLocalUser.mockResolvedValue(mockUser);
      emailVerificationTokenRepository.create.mockResolvedValue('mockVerificationToken');
      sendEmail.mockResolvedValue(true);
      refreshTokenRepository.create.mockResolvedValue({
        user: 'user123',
        tokenHash: 'hashedToken',
        expiresAt: new Date()
      });

      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          email: 'test@example.com',
          password: 'securepassword123'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(userRepository.createLocalUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com', passwordHash: 'mockedHashedPassword' })
      );
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should fail registration if the password is too short', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Password must be at least 8 characters long');
    });

    it('should fail registration if email is already registered', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com' };
      userRepository.findActiveByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          email: 'test@example.com',
          password: 'securepassword123'
        });

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Email is already registered');
    });
  });

  describe('POST /api/v1/users/login', () => {
    it('should successfully login and return tokens', async () => {
      const mockUserWithHash = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        isVerified: true,
        passwordHash: 'mockedHashedPassword' 
      };

      userRepository.findActiveByEmail.mockResolvedValue(mockUserWithHash);
      userRepository.resetFailedLoginState.mockResolvedValue({
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        isVerified: true
      });
      refreshTokenRepository.create.mockResolvedValue({
        user: 'user123',
        tokenHash: 'hashedToken',
        expiresAt: new Date()
      });

      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'test@example.com',
          password: 'securepassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should fail login with invalid credentials (user not found)', async () => {
      userRepository.findActiveByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should fail login with invalid credentials (incorrect password)', async () => {
      const mockUserWithHash = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        isVerified: true,
        passwordHash: 'mockedHashedPassword' 
      };

      userRepository.findActiveByEmail.mockResolvedValue(mockUserWithHash);
      bcrypt.compare.mockResolvedValue(false);
      userRepository.recordFailedLogin.mockResolvedValue({
        _id: 'user123',
        lockUntil: null
      });

      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toContain('Invalid email or password');
    });
  });

  describe('POST /api/v1/users/logout', () => {
    it('should clear refresh token and logout successfully', async () => {
      refreshTokenRepository.revokeByHash.mockResolvedValue({
        user: 'user123'
      });

      const response = await request(app)
        .post('/api/v1/users/logout')
        .send({
          refreshToken: 'someMockRefreshToken'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });
});
