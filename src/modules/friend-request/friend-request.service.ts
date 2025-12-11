import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGateway } from '../chat/gateway/chat.gateway';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class FriendRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    const existingContact = await this.prisma.contact.findFirst({
      where: {
        OR: [
          { userId: senderId, contactId: receiverId },
          { userId: receiverId, contactId: senderId },
        ],
      },
    });

    if (existingContact) {
      throw new ConflictException('You are already friends with this user');
    }

    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId,
            receiverId,
            status: { in: [RequestStatus.PENDING, RequestStatus.ACCEPTED] },
          },
          {
            senderId: receiverId,
            receiverId: senderId,
            status: { in: [RequestStatus.PENDING, RequestStatus.ACCEPTED] },
          },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === RequestStatus.PENDING) {
        throw new ConflictException('Friend request already sent');
      }
      throw new ConflictException('Friend request already accepted');
    }

    const request = await this.prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: RequestStatus.PENDING,
      },
      include: {
        sender: {
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
        receiver: {
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
    });

    this.chatGateway.emitFriendRequestReceived(receiverId, request);

    return request;
  }

  async acceptRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.receiverId !== userId) {
      throw new BadRequestException('You can only accept requests sent to you');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('This request has already been processed');
    }

    const [updatedRequest] = await this.prisma.$transaction([
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.ACCEPTED },
        include: {
          sender: {
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
          receiver: {
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
      }),
      this.prisma.contact.create({
        data: {
          userId: request.senderId,
          contactId: request.receiverId,
        },
      }),
      this.prisma.contact.create({
        data: {
          userId: request.receiverId,
          contactId: request.senderId,
        },
      }),
    ]);

    this.chatGateway.emitFriendRequestAccepted(
      request.senderId,
      updatedRequest,
    );

    return updatedRequest;
  }

  async rejectRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.receiverId !== userId) {
      throw new BadRequestException('You can only reject requests sent to you');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('This request has already been processed');
    }

    const updatedRequest = await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.REJECTED },
      include: {
        sender: {
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
        receiver: {
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
    });

    this.chatGateway.emitFriendRequestRejected(
      request.senderId,
      updatedRequest,
    );

    return updatedRequest;
  }

  async cancelRequest(requestId: string, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.senderId !== userId) {
      throw new BadRequestException('You can only cancel your own requests');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending requests');
    }

    await this.prisma.friendRequest.delete({
      where: { id: requestId },
    });

    return { message: 'Friend request cancelled successfully' };
  }

  async getPendingRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: RequestStatus.PENDING,
      },
      include: {
        sender: {
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
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  async getSentRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        senderId: userId,
        status: RequestStatus.PENDING,
      },
      include: {
        receiver: {
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
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  async checkFriendStatus(userId: string, targetUserId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        OR: [
          { userId, contactId: targetUserId },
          { userId: targetUserId, contactId: userId },
        ],
      },
    });

    if (contact) {
      return {
        isFriend: true,
        requestStatus: null,
        requestId: null,
        canSendRequest: false,
      };
    }

    const request = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId },
        ],
        status: { in: [RequestStatus.PENDING, RequestStatus.ACCEPTED] },
      },
    });

    if (request) {
      return {
        isFriend: false,
        requestStatus: request.status,
        requestId: request.id,
        canSendRequest: false,
      };
    }

    return {
      isFriend: false,
      requestStatus: null,
      requestId: null,
      canSendRequest: true,
    };
  }
}
