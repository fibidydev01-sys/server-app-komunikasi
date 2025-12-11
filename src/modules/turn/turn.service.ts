// ================================================
// FILE 2: src/modules/turn/turn.service.ts
// ================================================

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface XirsysIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface XirsysResponse {
  v: {
    iceServers: XirsysIceServer[];
  };
  s: string;
}

interface IceServersResponse {
  iceServers: XirsysIceServer[];
  ttl: number;
  provider: string;
}

@Injectable()
export class TurnService {
  private readonly logger = new Logger(TurnService.name);

  // Xirsys config
  private readonly xirsysIdent: string;
  private readonly xirsysSecret: string;
  private readonly xirsysChannel: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.xirsysIdent =
      this.configService.get<string>('XIRSYS_IDENT') || 'fibidy';
    this.xirsysSecret = this.configService.get<string>('XIRSYS_SECRET') || '';
    this.xirsysChannel =
      this.configService.get<string>('XIRSYS_CHANNEL') || 'komunikasi-app';

    if (!this.xirsysSecret) {
      this.logger.warn('⚠️ XIRSYS_SECRET not configured! TURN will not work.');
    }
  }

  /**
   * Fetch fresh TURN credentials from Xirsys
   * Credentials valid for ~24 hours
   */
  async getIceServers(): Promise<IceServersResponse> {
    try {
      this.logger.debug('🔄 Fetching fresh Xirsys credentials...');

      const url = `https://global.xirsys.net/_turn/${this.xirsysChannel}`;

      const response = await firstValueFrom(
        this.httpService.put<XirsysResponse>(
          url,
          {}, // empty body
          {
            auth: {
              username: this.xirsysIdent,
              password: this.xirsysSecret,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.data.s !== 'ok') {
        throw new Error(`Xirsys error: ${response.data.s}`);
      }

      const iceServers = response.data.v.iceServers;

      this.logger.debug(`✅ Got ${iceServers.length} ICE servers from Xirsys`);

      // Add Google STUN as backup
      const combinedServers: XirsysIceServer[] = [
        ...iceServers,
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ];

      return {
        iceServers: combinedServers,
        ttl: 86400, // 24 hours in seconds
        provider: 'xirsys',
      };
    } catch (error) {
      this.logger.error('❌ Failed to fetch Xirsys credentials:', error);

      // Fallback to STUN only (will fail on symmetric NAT)
      return {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
        ttl: 3600,
        provider: 'fallback-stun-only',
      };
    }
  }
}
