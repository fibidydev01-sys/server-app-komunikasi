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
export class CallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CallGateway.name);

  @WebSocketServer()
  server!: Server;

  private userSockets: Map<string, string> = new Map();

  // ✅ ADD: Handle connection
  handleConnection(client: SocketWithData) {
    const userId = client.data?.userId;
    if (userId) {
      this.registerUserSocket(userId, client.id);
      this.logger.debug(`✅ User ${userId} connected with socket ${client.id}`);
      this.logger.debug(`📊 Active connections: ${this.userSockets.size}`);
    }
  }

  // ✅ ADD: Handle disconnection
  handleDisconnect(client: SocketWithData) {
    const userId = client.data?.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.debug(`❌ User ${userId} disconnected`);
      this.logger.debug(`📊 Active connections: ${this.userSockets.size}`);
    }
  }

  registerUserSocket(userId: string, socketId: string) {
    this.userSockets.set(userId, socketId);
    this.logger.debug(`🔗 Registered user ${userId} -> socket ${socketId}`);
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
        `📊 Available sockets: ${Array.from(this.userSockets.keys()).join(', ')}`,
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
        from: senderId, // ✅ ADD: Include sender info
      });
      this.logger.debug(`✅ Offer forwarded to socket ${socketId}`);
    } else {
      this.logger.error(
        `❌ Cannot forward offer - receiver ${data.to} not connected`,
      );
      this.logger.debug(
        `📊 Available sockets: ${Array.from(this.userSockets.keys()).join(', ')}`,
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
        from: senderId, // ✅ ADD: Include sender info
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
        from: senderId, // ✅ ADD: Include sender info
      });
      this.logger.debug(`✅ ICE candidate forwarded`);
    } else {
      this.logger.error(
        `❌ Cannot forward ICE - receiver ${data.to} not connected`,
      );
    }
  }
}
