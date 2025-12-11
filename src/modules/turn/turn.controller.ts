// ================================================
// FILE 3: src/modules/turn/turn.controller.ts
// ================================================

import { Controller, Get, HttpStatus, Logger } from '@nestjs/common';
import { TurnService } from './turn.service';

interface TurnCredentialsResponse {
  statusCode: number;
  message: string;
  data: {
    iceServers: any[];
    ttl: number;
    provider: string;
  };
}

@Controller('turn')
export class TurnController {
  private readonly logger = new Logger(TurnController.name);

  constructor(private readonly turnService: TurnService) {}

  /**
   * GET /api/turn/credentials
   * Fetch fresh TURN credentials for WebRTC
   */
  @Get('credentials')
  async getCredentials(): Promise<TurnCredentialsResponse> {
    this.logger.debug('📞 Request for TURN credentials');

    const result = await this.turnService.getIceServers();

    this.logger.debug(
      `✅ Returning ${result.iceServers.length} ICE servers (${result.provider})`,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'TURN credentials retrieved successfully',
      data: result,
    };
  }
}
