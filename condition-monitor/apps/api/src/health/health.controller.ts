import { Controller, Get } from '@nestjs/common';

/**
 * Liveness check for Docker, CI and the web app. It is public: the session guard,
 * added with authentication, will leave it open.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
