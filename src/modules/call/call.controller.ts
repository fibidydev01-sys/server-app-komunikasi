import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CallService } from './call.service';
import { CallGateway } from './gateway/call.gateway';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InitiateCallDto } from './dto/initiate-call.dto';
import type { User } from '@prisma/client';
import type { Call } from '@prisma/client';

interface CallResponse {
  statusCode: number;
  message: string;
  data?: Call | Call[];
}

@Controller('calls')
export class CallController {
  private readonly logger = new Logger(CallController.name);

  constructor(
    private readonly callService: CallService,
    private readonly callGateway: CallGateway, // ✅ INJECT GATEWAY
  ) {}

  @Post('initiate')
  async initiateCall(
    @CurrentUser() user: User,
    @Body() dto: InitiateCallDto,
  ): Promise<CallResponse> {
    const call = await this.callService.initiateCall(user.id, dto);

    // ✅ EMIT EVENT KE RECEIVER
    this.callGateway.emitIncomingCall(dto.receiverId, call);

    this.logger.log(
      `📞 Call initiated: ${user.id} → ${dto.receiverId} (${call.id})`,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Call initiated successfully',
      data: call,
    };
  }

  @Post(':id/answer')
  async answerCall(
    @CurrentUser() user: User,
    @Param('id') callId: string,
  ): Promise<CallResponse> {
    const call = await this.callService.answerCall(callId, user.id);

    // ✅ EMIT EVENT KE CALLER
    this.callGateway.emitCallAnswered(call.callerId, call);

    this.logger.log(`✅ Call answered: ${callId} by ${user.id}`);

    return {
      statusCode: HttpStatus.OK,
      message: 'Call answered successfully',
      data: call,
    };
  }

  @Post(':id/end')
  async endCall(
    @CurrentUser() user: User,
    @Param('id') callId: string,
    @Body() body: { duration?: number },
  ): Promise<CallResponse> {
    const call = await this.callService.endCall(callId, user.id, body.duration);

    // ✅ EMIT EVENT KE KEDUA USER
    const otherUserId =
      call.callerId === user.id ? call.receiverId : call.callerId;
    this.callGateway.emitCallEnded(otherUserId, call);

    this.logger.log(`📞 Call ended: ${callId} by ${user.id}`);

    return {
      statusCode: HttpStatus.OK,
      message: 'Call ended successfully',
      data: call,
    };
  }

  @Post(':id/reject')
  async rejectCall(
    @CurrentUser() user: User,
    @Param('id') callId: string,
  ): Promise<CallResponse> {
    const call = await this.callService.rejectCall(callId, user.id);

    // ✅ EMIT EVENT KE CALLER
    this.callGateway.emitCallRejected(call.callerId, call);

    this.logger.log(`❌ Call rejected: ${callId} by ${user.id}`);

    return {
      statusCode: HttpStatus.OK,
      message: 'Call rejected successfully',
      data: call,
    };
  }

  @Get('history')
  async getCallHistory(@CurrentUser() user: User): Promise<CallResponse> {
    const calls = await this.callService.getCallHistory(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Call history retrieved successfully',
      data: calls,
    };
  }

  @Delete(':id')
  async deleteCallLog(
    @CurrentUser() user: User,
    @Param('id') callId: string,
  ): Promise<CallResponse> {
    const result = await this.callService.deleteCallLog(callId, user.id);

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}
