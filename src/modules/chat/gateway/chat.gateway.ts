// src/modules/chat/gateway/chat.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '../../../common/interface/user.interface';
import type { Message, FriendRequest } from '@prisma/client';

interface SocketData {
  userId: string;
}

interface SocketWithData extends Socket {
  data: SocketData;
}

interface SendMessageData {
  chatId: string;
  content: string;
  type?: string;
  image?: string;
  replyToId?: string;
}

interface TypingData {
  chatId: string;
}

interface MessageReadData {
  messageId: string;
}

interface MessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  private userSockets: Map<string, string> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: SocketWithData): Promise<void> {
    try {
      const token = client.handshake.auth.token as string | undefined;

      this.logger.debug(`Connection attempt from ${client.id}`);

      if (!token) {
        this.logger.error('No token provided in handshake');
        throw new UnauthorizedException('No authentication token found!');
      }

      const jwtSecret =
        this.configService.get<string>('jwt.secret') || 'secret_jwt';

      let payload: JwtPayload;
      try {
        payload = this.jwtService.verify<JwtPayload>(token, {
          secret: jwtSecret,
        });
        this.logger.debug(`Token verified for userId: ${payload.userId}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Token verification failed: ${errorMessage}`);
        throw new UnauthorizedException('Invalid token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
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
      });

      if (!user) {
        this.logger.error(`User not found for userId: ${payload.userId}`);
        throw new UnauthorizedException('User not found');
      }

      client.data.userId = user.id;
      this.userSockets.set(user.id, client.id);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeen: null },
      });

      this.logger.log(`User ${user.name} connected: ${client.id}`);

      const contacts = await this.prisma.contact.findMany({
        where: { contactId: user.id },
        select: { userId: true },
      });

      contacts.forEach((contact) => {
        const socketId = this.userSockets.get(contact.userId);
        if (socketId) {
          this.server.to(socketId).emit('user:online', {
            userId: user.id,
            isOnline: true,
          });
        }
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Connection error: ${errorMessage}`);
      client.emit('error', { message: errorMessage });
      client.disconnect();
    }
  }

  async handleDisconnect(client: SocketWithData): Promise<void> {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);

      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() },
      });

      const contacts = await this.prisma.contact.findMany({
        where: { contactId: userId },
        select: { userId: true },
      });

      contacts.forEach((contact) => {
        const socketId = this.userSockets.get(contact.userId);
        if (socketId) {
          this.server.to(socketId).emit('user:offline', {
            userId,
            isOnline: false,
            lastSeen: new Date(),
          });
        }
      });

      this.logger.log(`User ${userId} disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: SendMessageData,
  ): Promise<MessageResponse> {
    try {
      const userId = client.data.userId;

      this.logger.debug(
        `Sending message from ${userId} to chat ${data.chatId}`,
      );

      const messageData = await this.prisma.message.create({
        data: {
          content: data.content,
          type: data.type || 'text',
          image: data.image || null,
          chatId: data.chatId,
          senderId: userId,
          replyToId: data.replyToId || null,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true,
              username: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          replyTo: {
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
          chat: {
            select: {
              id: true,
              createdAt: true,
              updatedAt: true,
              isGroup: true,
              groupName: true,
              createdById: true,
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
            },
          },
        },
      });

      await this.prisma.chat.update({
        where: { id: data.chatId },
        data: { updatedAt: new Date() },
      });

      if (messageData.chat?.participants) {
        this.logger.debug(
          `Broadcasting to ${messageData.chat.participants.length} participants`,
        );
        messageData.chat.participants.forEach((participant) => {
          const socketId = this.userSockets.get(participant.id);
          if (socketId) {
            this.server.to(socketId).emit('message:receive', messageData);
          }
        });
      }

      return { success: true, message: messageData };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Send message error: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: TypingData,
  ): void {
    const userId = client.data.userId;
    client
      .to(data.chatId)
      .emit('typing:start', { userId, chatId: data.chatId });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: TypingData,
  ): void {
    const userId = client.data.userId;
    client.to(data.chatId).emit('typing:stop', { userId, chatId: data.chatId });
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() _client: SocketWithData,
    @MessageBody() data: MessageReadData,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.prisma.message.update({
        where: { id: data.messageId },
        data: { read: true },
      });

      this.server.emit('message:read', { messageId: data.messageId });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  emitFriendRequestReceived(receiverId: string, request: FriendRequest): void {
    const socketId = this.userSockets.get(receiverId);
    if (socketId) {
      this.server.to(socketId).emit('friend-request:received', { request });
      this.logger.debug(`Friend request notification sent to ${receiverId}`);
    }
  }

  emitFriendRequestAccepted(senderId: string, request: FriendRequest): void {
    const socketId = this.userSockets.get(senderId);
    if (socketId) {
      this.server.to(socketId).emit('friend-request:accepted', { request });
      this.logger.debug(
        `Friend request accepted notification sent to ${senderId}`,
      );
    }
  }

  emitFriendRequestRejected(senderId: string, request: FriendRequest): void {
    const socketId = this.userSockets.get(senderId);
    if (socketId) {
      this.server.to(socketId).emit('friend-request:rejected', { request });
      this.logger.debug(
        `Friend request rejected notification sent to ${senderId}`,
      );
    }
  }
}
