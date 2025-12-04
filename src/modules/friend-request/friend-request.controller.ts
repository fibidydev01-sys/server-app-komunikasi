import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { FriendRequestService } from './friend-request.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SendRequestDto } from './dto/send-request.dto';
import type { User, FriendRequest } from '@prisma/client';
import { RequestStatus } from '@prisma/client';

interface FriendRequestResponse {
  statusCode: number;
  message: string;
  data?: FriendRequest | FriendRequest[];
}

interface FriendStatusResponse {
  statusCode: number;
  message: string;
  data: {
    isFriend: boolean;
    requestStatus: RequestStatus | null;
    requestId: string | null;
    canSendRequest: boolean;
  };
}

@Controller('friend-requests')
export class FriendRequestController {
  constructor(private readonly friendRequestService: FriendRequestService) {}

  @Post('send')
  async sendRequest(
    @CurrentUser() user: User,
    @Body() dto: SendRequestDto,
  ): Promise<FriendRequestResponse> {
    const request = await this.friendRequestService.sendRequest(
      user.id,
      dto.receiverId,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Friend request sent successfully',
      data: request,
    };
  }

  @Post(':requestId/accept')
  async acceptRequest(
    @CurrentUser() user: User,
    @Param('requestId') requestId: string,
  ): Promise<FriendRequestResponse> {
    const request = await this.friendRequestService.acceptRequest(
      requestId,
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Friend request accepted',
      data: request,
    };
  }

  @Post(':requestId/reject')
  async rejectRequest(
    @CurrentUser() user: User,
    @Param('requestId') requestId: string,
  ): Promise<FriendRequestResponse> {
    const request = await this.friendRequestService.rejectRequest(
      requestId,
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Friend request rejected',
      data: request,
    };
  }

  @Delete(':requestId/cancel')
  async cancelRequest(
    @CurrentUser() user: User,
    @Param('requestId') requestId: string,
  ): Promise<FriendRequestResponse> {
    const result = await this.friendRequestService.cancelRequest(
      requestId,
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Get('pending')
  async getPendingRequests(
    @CurrentUser() user: User,
  ): Promise<FriendRequestResponse> {
    const requests = await this.friendRequestService.getPendingRequests(
      user.id,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Pending requests retrieved successfully',
      data: requests,
    };
  }

  @Get('sent')
  async getSentRequests(
    @CurrentUser() user: User,
  ): Promise<FriendRequestResponse> {
    const requests = await this.friendRequestService.getSentRequests(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Sent requests retrieved successfully',
      data: requests,
    };
  }

  @Get('status/:userId')
  async checkFriendStatus(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
  ): Promise<FriendStatusResponse> {
    const status = await this.friendRequestService.checkFriendStatus(
      user.id,
      userId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Friend status retrieved successfully',
      data: status,
    };
  }
}
