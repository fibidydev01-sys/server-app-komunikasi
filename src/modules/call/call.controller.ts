import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { CallService } from './call.service';
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
  constructor(private readonly callService: CallService) {}

  @Post('initiate')
  async initiateCall(
    @CurrentUser() user: User,
    @Body() dto: InitiateCallDto,
  ): Promise<CallResponse> {
    const call = await this.callService.initiateCall(user.id, dto);

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
