import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Patch,
  HttpStatus,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Message } from '../../common/interface/chat.interface';
import type { User } from '../../common/interface/user.interface';

interface MessageResponse {
  statusCode: number;
  message: string;
  data?: Message | Message[];
}

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  async createMessage(
    @CurrentUser() user: User,
    @Body() dto: CreateMessageDto,
  ): Promise<MessageResponse> {
    const message = await this.messageService.createMessage(user.id, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Message sent successfully',
      data: message,
    };
  }

  @Get('chat/:chatId')
  async getChatMessages(
    @CurrentUser() user: User,
    @Param('chatId') chatId: string,
  ): Promise<MessageResponse> {
    const messages = await this.messageService.getChatMessages(chatId, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Messages retrieved successfully',
      data: messages,
    };
  }

  @Delete(':id')
  async deleteMessage(
    @CurrentUser() user: User,
    @Param('id') messageId: string,
  ): Promise<MessageResponse> {
    const result = await this.messageService.deleteMessage(messageId, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id') messageId: string,
  ): Promise<MessageResponse> {
    const message = await this.messageService.markAsRead(messageId, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Message marked as read',
      data: message,
    };
  }
}
