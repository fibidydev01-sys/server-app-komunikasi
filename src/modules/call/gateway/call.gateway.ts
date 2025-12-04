// src/modules/call/gateway/call.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Call } from '@prisma/client';
import type { JwtPayload } from '../../../common/interface/user.interface';

interface SocketData {
  userId: string;
}

interface SocketWithData extends Socket {
  data: SocketData;
}

interface WebRTCSignal {
  callId: string;
  signal: any;
  to: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class CallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CallGateway.name);

  @WebSocketServer()
  server!: Server;

  private userSockets: Map<string, string> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ✅ SAME PATTERN as ChatGateway
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
        },
      });

      if (!user) {
        this.logger.error(`User not found for userId: ${payload.userId}`);
        throw new UnauthorizedException('User not found');
      }

      client.data.userId = user.id;
      this.userSockets.set(user.id, client.id);

      this.logger.log(`✅ User ${user.name} connected: ${client.id}`);
      this.logger.debug(`📊 Total connected users: ${this.userSockets.size}`);
      this.logger.debug(
        `📋 Connected users: ${Array.from(this.userSockets.keys()).join(', ')}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Connection error: ${errorMessage}`);
      client.emit('error', { message: errorMessage });
      client.disconnect();
    }
  }

  // ✅ SAME PATTERN as ChatGateway
  async handleDisconnect(client: SocketWithData): Promise<void> {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);

      // Contoh: update user status di database
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: false },
      });

      this.logger.log(`❌ User ${userId} disconnected: ${client.id}`);
      this.logger.debug(`📊 Total connected users: ${this.userSockets.size}`);
    }
  }

  emitIncomingCall(receiverId: string, call: Call): void {
    const socketId = this.userSockets.get(receiverId);

    if (socketId) {
      this.server.to(socketId).emit('call:incoming', { call });
      this.logger.debug(
        `📞 Incoming call sent to ${receiverId} (socket: ${socketId})`,
      );
    } else {
      this.logger.warn(`⚠️ Cannot send call to ${receiverId} - not connected`);
      this.logger.debug(
        `📋 Available users: ${Array.from(this.userSockets.keys()).join(', ')}`,
      );
    }
  }

  emitCallAnswered(callerId: string, call: Call): void {
    const socketId = this.userSockets.get(callerId);

    if (socketId) {
      this.server.to(socketId).emit('call:answered', { call });
      this.logger.debug(`✅ Call answered notification sent to ${callerId}`);
    } else {
      this.logger.warn(`⚠️ Cannot notify ${callerId} - not connected`);
    }
  }

  emitCallRejected(callerId: string, call: Call): void {
    const socketId = this.userSockets.get(callerId);

    if (socketId) {
      this.server.to(socketId).emit('call:rejected', { call });
      this.logger.debug(`❌ Call rejected notification sent to ${callerId}`);
    } else {
      this.logger.warn(`⚠️ Cannot notify ${callerId} - not connected`);
    }
  }

  emitCallEnded(userId: string, call: Call): void {
    const socketId = this.userSockets.get(userId);

    if (socketId) {
      this.server.to(socketId).emit('call:ended', { call });
      this.logger.debug(`📞 Call ended notification sent to ${userId}`);
    } else {
      this.logger.warn(`⚠️ Cannot notify ${userId} - not connected`);
    }
  }

  @SubscribeMessage('webrtc:offer')
  handleOffer(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: WebRTCSignal,
  ): void {
    const senderId = client.data?.userId;
    const socketId = this.userSockets.get(data.to);

    this.logger.debug(
      `📤 WebRTC Offer from ${senderId} to ${data.to} (callId: ${data.callId})`,
    );

    if (socketId) {
      this.server.to(socketId).emit('webrtc:offer', {
        ...data,
        from: senderId,
      });
      this.logger.debug(`✅ Offer forwarded to socket ${socketId}`);
    } else {
      this.logger.error(
        `❌ Cannot forward offer - receiver ${data.to} not connected`,
      );
      this.logger.debug(
        `📋 Available users: ${Array.from(this.userSockets.keys()).join(', ')}`,
      );
    }
  }

  @SubscribeMessage('webrtc:answer')
  handleAnswer(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: WebRTCSignal,
  ): void {
    const senderId = client.data?.userId;
    const socketId = this.userSockets.get(data.to);

    this.logger.debug(
      `📤 WebRTC Answer from ${senderId} to ${data.to} (callId: ${data.callId})`,
    );

    if (socketId) {
      this.server.to(socketId).emit('webrtc:answer', {
        ...data,
        from: senderId,
      });
      this.logger.debug(`✅ Answer forwarded to socket ${socketId}`);
    } else {
      this.logger.error(
        `❌ Cannot forward answer - receiver ${data.to} not connected`,
      );
    }
  }

  @SubscribeMessage('webrtc:ice')
  handleICE(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() data: WebRTCSignal,
  ): void {
    const senderId = client.data?.userId;
    const socketId = this.userSockets.get(data.to);

    this.logger.debug(`📤 WebRTC ICE from ${senderId} to ${data.to}`);

    if (socketId) {
      this.server.to(socketId).emit('webrtc:ice', {
        ...data,
        from: senderId,
      });
      this.logger.debug(`✅ ICE candidate forwarded`);
    } else {
      this.logger.error(
        `❌ Cannot forward ICE - receiver ${data.to} not connected`,
      );
    }
  }
}
