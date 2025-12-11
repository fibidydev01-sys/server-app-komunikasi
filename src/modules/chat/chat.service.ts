import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createChat(userId: string, dto: CreateChatDto) {
    if (userId === dto.participantId) {
      throw new BadRequestException('Cannot create chat with yourself');
    }

    const participant = await this.prisma.user.findUnique({
      where: { id: dto.participantId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    const isContact = await this.prisma.contact.findFirst({
      where: {
        userId,
        contactId: dto.participantId,
        isBlocked: false,
      },
    });

    if (!isContact) {
      throw new ForbiddenException(
        'You can only chat with your contacts. Send a friend request first.',
      );
    }

    const isBlocked = await this.prisma.contact.findFirst({
      where: {
        OR: [
          { userId, contactId: dto.participantId, isBlocked: true },
          { userId: dto.participantId, contactId: userId, isBlocked: true },
        ],
      },
    });

    if (isBlocked) {
      throw new ForbiddenException('Cannot create chat with blocked user');
    }

    const existingChat = await this.prisma.chat.findFirst({
      where: {
        AND: [
          { participants: { some: { id: userId } } },
          { participants: { some: { id: dto.participantId } } },
          { isGroup: false },
        ],
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
            about: true,
            gender: true,
            profilePhoto: true,
            lastSeen: true,
            isOnline: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existingChat) {
      return existingChat;
    }

    const chat = await this.prisma.chat.create({
      data: {
        createdById: userId,
        participants: {
          connect: [{ id: userId }, { id: dto.participantId }],
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
            about: true,
            gender: true,
            profilePhoto: true,
            lastSeen: true,
            isOnline: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return chat;
  }

  async getUserChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
            about: true,
            gender: true,
            profilePhoto: true,
            lastSeen: true,
            isOnline: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return chats;
  }

  async getChatById(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: { id: userId },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
            about: true,
            gender: true,
            profilePhoto: true,
            lastSeen: true,
            isOnline: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  async deleteChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: { id: userId },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    await this.prisma.chat.delete({
      where: { id: chatId },
    });

    return { message: 'Chat deleted successfully' };
  }
}
