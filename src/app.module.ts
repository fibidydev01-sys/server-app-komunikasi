// src/app.module.ts
// ADD TurnModule to imports

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { envConfig } from './config/env.config';
import { PrismaModule } from './prisma/prisma.module';

// Existing Modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ChatModule } from './modules/chat/chat.module';
import { MessageModule } from './modules/message/message.module';

// Friend System Modules
import { FriendRequestModule } from './modules/friend-request/friend-request.module';
import { ContactModule } from './modules/contact/contact.module';

// Advanced Features Modules
import { StatusModule } from './modules/status/status.module';
import { CallModule } from './modules/call/call.module';
import { MediaModule } from './modules/media/media.module';
import { ProfileModule } from './modules/profile/profile.module';
import { SettingsModule } from './modules/settings/settings.module';

// ✅ ADD: TURN Module
import { TurnModule } from './modules/turn/turn.module';

// Guards & Filters
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Controllers & Services
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Schedule Module for Cron Jobs
    ScheduleModule.forRoot(),

    // Core
    PrismaModule,

    // Authentication & User
    AuthModule,
    UserModule,

    // Chat System
    ChatModule,
    MessageModule,

    // Friend System
    FriendRequestModule,
    ContactModule,

    // Advanced Features
    StatusModule,
    CallModule,
    MediaModule,
    ProfileModule,
    SettingsModule,

    // ✅ ADD: TURN credentials
    TurnModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
