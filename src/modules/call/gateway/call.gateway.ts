// src/modules/call/gateway/call.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import type { Call } from '@prisma/client';

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
  },
})
export class CallGateway {
  private readonly logger = new Logger(CallGateway.name);

  @WebSocketServer()
  server!: Server;

  private userSockets: Map<string, string> = new Map();

  registerUserSocket(userId: string, socketId: string) {
    this.userSockets.set(userId, socketId);
  }

  emitIncomingCall(receiverId: string, call: Call): void {
    const socketId = this.userSockets.get(receiverId);
    if (socketId) {
      this.server.to(socketId).emit('call:incoming', { call });
      this.logger.debug(`Incoming call notification sent to ${receiverId}`);
    }
  }

  emitCallAnswered(callerId: string, call: Call): void {
    const socketId = this.userSockets.get(callerId);
    if (socketId) {
      this.server.to(socketId).emit('call:answered', { call });
      this.logger.debug(`Call answered notification sent to ${callerId}`);
    }
  }

  emitCallRejected(callerId: string, call: Call): void {
    const socketId = this.userSockets.get(callerId);
    if (socketId) {
      this.server.to(socketId).emit('call:rejected', { call });
      this.logger.debug(`Call rejected notification sent to ${callerId}`);
    }
  }

  emitCallEnded(userId: string, call: Call): void {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('call:ended', { call });
      this.logger.debug(`Call ended notification sent to ${userId}`);
    }
  }

  @SubscribeMessage('webrtc:offer')
  handleOffer(
    @ConnectedSocket() _client: SocketWithData,
    @MessageBody() data: WebRTCSignal,
  ): void {
    const socketId = this.userSockets.get(data.to);
    if (socketId) {
      this.server.to(socketId).emit('webrtc:offer', data);
    }
  }

  @SubscribeMessage('webrtc:answer')
  handleAnswer(
    @ConnectedSocket() _client: SocketWithData,
    @MessageBody() data: WebRTCSignal,
  ): void {
    const socketId = this.userSockets.get(data.to);
    if (socketId) {
      this.server.to(socketId).emit('webrtc:answer', data);
    }
  }

  @SubscribeMessage('webrtc:ice')
  handleICE(
    @ConnectedSocket() _client: SocketWithData,
    @MessageBody() data: WebRTCSignal,
  ): void {
    const socketId = this.userSockets.get(data.to);
    if (socketId) {
      this.server.to(socketId).emit('webrtc:ice', data);
    }
  }
}
