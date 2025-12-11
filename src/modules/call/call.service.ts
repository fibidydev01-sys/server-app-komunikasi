import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { CallStatus } from '@prisma/client';

@Injectable()
export class CallService {
  constructor(private readonly prisma: PrismaService) {}

  async initiateCall(callerId: string, dto: InitiateCallDto) {
    const isContact = await this.prisma.contact.findFirst({
      where: {
        userId: callerId,
        contactId: dto.receiverId,
        isBlocked: false,
      },
    });

    if (!isContact) {
      throw new ForbiddenException('You can only call your contacts');
    }

    const isBlocked = await this.prisma.contact.findFirst({
      where: {
        userId: dto.receiverId,
        contactId: callerId,
        isBlocked: true,
      },
    });

    if (isBlocked) {
      throw new ForbiddenException('Cannot call this user');
    }

    // ✅ FIX: Set status to RINGING (not INITIATED!)
    const call = await this.prisma.call.create({
      data: {
        callerId,
        receiverId: dto.receiverId,
        type: dto.type,
        status: CallStatus.RINGING, // ✅ CHANGED from INITIATED
      },
      include: {
        caller: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profilePhoto: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profilePhoto: true,
          },
        },
      },
    });

    return call;
  }

  async answerCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.receiverId !== userId) {
      throw new ForbiddenException('Only receiver can answer the call');
    }

    // ✅ FIX: Allow INITIATED or RINGING
    if (
      call.status !== CallStatus.INITIATED &&
      call.status !== CallStatus.RINGING
    ) {
      throw new BadRequestException(
        `Call cannot be answered. Current status: ${call.status}`,
      );
    }

    const updatedCall = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: CallStatus.ANSWERED,
        startedAt: new Date(),
      },
      include: {
        caller: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profilePhoto: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profilePhoto: true,
          },
        },
      },
    });

    return updatedCall;
  }

  async endCall(callId: string, userId: string, duration?: number) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId && call.receiverId !== userId) {
      throw new ForbiddenException('You are not part of this call');
    }

    const updatedCall = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: CallStatus.ENDED,
        endedAt: new Date(),
        duration: duration || 0,
      },
      include: {
        caller: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return updatedCall;
  }

  async rejectCall(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.receiverId !== userId) {
      throw new ForbiddenException('Only receiver can reject the call');
    }

    const updatedCall = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: CallStatus.REJECTED,
        endedAt: new Date(),
      },
      include: {
        caller: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return updatedCall;
  }

  async getCallHistory(userId: string) {
    const calls = await this.prisma.call.findMany({
      where: {
        OR: [{ callerId: userId }, { receiverId: userId }],
      },
      include: {
        caller: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profilePhoto: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return calls;
  }

  async deleteCallLog(callId: string, userId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (call.callerId !== userId && call.receiverId !== userId) {
      throw new ForbiddenException('You can only delete your own call logs');
    }

    await this.prisma.call.delete({
      where: { id: callId },
    });

    return { message: 'Call log deleted successfully' };
  }
}
