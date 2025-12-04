import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User, Chat } from '@prisma/client';

interface ChatResponse {
  statusCode: number;
  message: string;
  data?: Chat | Chat[];
}

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(
    @CurrentUser() user: User,
    @Body() dto: CreateChatDto,
  ): Promise<ChatResponse> {
    const chat = await this.chatService.createChat(user.id, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Chat created successfully',
      data: chat,
    };
  }

  @Get()
  async getUserChats(@CurrentUser() user: User): Promise<ChatResponse> {
    const chats = await this.chatService.getUserChats(user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Chats retrieved successfully',
      data: chats,
    };
  }

  @Get(':id')
  async getChatById(
    @CurrentUser() user: User,
    @Param('id') chatId: string,
  ): Promise<ChatResponse> {
    const chat = await this.chatService.getChatById(chatId, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Chat retrieved successfully',
      data: chat,
    };
  }

  @Delete(':id')
  async deleteChat(
    @CurrentUser() user: User,
    @Param('id') chatId: string,
  ): Promise<ChatResponse> {
    const result = await this.chatService.deleteChat(chatId, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}
