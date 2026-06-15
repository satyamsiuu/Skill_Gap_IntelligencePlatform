/**
 * SGIP — App Controller Spec (Health Check)
 * Tests: health endpoint with Redis + DB component status reporting
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { RedisService } from './common/redis/redis.service';
import { PrismaService } from './common/prisma/prisma.service';

const mockRedisService = {
  checkHealth: jest.fn(),
};

const mockPrismaService = {
  $queryRaw: jest.fn(),
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: RedisService, useValue: mockRedisService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('GET /health', () => {
    it('returns ok status when all components are healthy', async () => {
      mockRedisService.checkHealth.mockResolvedValue({
        status: 'ok',
        latencyMs: 2,
      });
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const response = await appController.getHealth();

      expect(response.status).toBe('ok');
      expect(response.components.redis.status).toBe('ok');
      expect(response.components.database.status).toBe('ok');
      expect(response.timestamp).toBeDefined();
      expect(typeof response.uptime).toBe('number');
    });

    it('returns degraded when Redis is unavailable', async () => {
      mockRedisService.checkHealth.mockResolvedValue({
        status: 'degraded',
        error: 'ECONNREFUSED',
      });
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const response = await appController.getHealth();

      expect(response.status).toBe('degraded');
      expect(response.components.redis.status).toBe('degraded');
      expect(response.components.database.status).toBe('ok');
    });

    it('returns degraded when DB is unavailable', async () => {
      mockRedisService.checkHealth.mockResolvedValue({
        status: 'ok',
        latencyMs: 1,
      });
      mockPrismaService.$queryRaw.mockRejectedValue(
        new Error('Connection refused'),
      );

      const response = await appController.getHealth();

      expect(response.status).toBe('degraded');
      expect(response.components.database.status).toBe('unavailable');
      expect(response.components.database.error).toBeDefined();
    });

    it('returns down when all components fail', async () => {
      mockRedisService.checkHealth.mockRejectedValue(new Error('Redis down'));
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB down'));

      const response = await appController.getHealth();

      expect(response.status).toBe('down');
    });
  });
});
