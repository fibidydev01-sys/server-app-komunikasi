import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Health check endpoint
  @Public()
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      message: 'Chat App Pro API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  // API info endpoint
  @Public()
  @Get('info')
  getInfo() {
    return {
      name: 'Chat App Pro API',
      version: '1.0.0',
      description: 'Real-time chat application with WebSocket',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth/*',
        users: '/api/users/*',
        messages: '/api/messages/*',
        websocket: 'ws://localhost:8000',
      },
    };
  }
}
