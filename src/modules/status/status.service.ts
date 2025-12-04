import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusPrivacyDto } from './dto/update-status-privacy.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Status, StatusView } from '@prisma/client';

interface StatusWithPrivacy extends Status {
  user: {
    id: string;
    name: string;
    username: string | null;
    avatar: string | null;
    profilePhoto: string | null;
  };
  views?: Array<{
    id: string;
    viewedAt: Date;
    viewer: {
      id: string;
      name: string;
      username: string | null;
      avatar: string | null;
    };
  }>;
  privacy?: {
    id: string;
    statusId: string;
    type: string;
    exceptUserIds: string[];
    onlyUserIds: string[];
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

@Injectable()
export class StatusService {
  constructor(private readonly prisma: PrismaService) {}

  async createStatus(userId: string, dto: CreateStatusDto): Promise<Status> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const status = await this.prisma.status.create({
      data: {
        userId,
        type: dto.type,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        backgroundColor: dto.backgroundColor || '#000000',
        expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
            profilePhoto: true,
            about: true,
            gender: true,
            lastSeen: true,
            isOnline: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        privacy: true,
      },
    });

    return status;
  }

  async getContactsStatuses(userId: string): Promise<Status[]> {
    const contacts = await this.prisma.contact.findMany({
      where: {
        userId,
        isBlocked: false,
      },
      select: { contactId: true },
    });

    const contactIds = contacts.map((c) => c.contactId);

    const statuses = await this.prisma.status.findMany({
      where: {
        userId: { in: contactIds },
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profilePhoto: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        views: {
          where: { viewerId: userId },
          select: { id: true, viewedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return statuses;
  }

  async getMyStatuses(userId: string): Promise<Status[]> {
    const statuses = await this.prisma.status.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: {
        views: {
          include: {
            viewer: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { viewedAt: 'desc' },
        },
        privacy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return statuses;
  }

  async getStatusById(statusId: string, userId: string): Promise<Status> {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            profilePhoto: true,
          },
        },
        views: {
          include: {
            viewer: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        privacy: true,
      },
    });

    if (!status) {
      throw new NotFoundException('Status not found');
    }

    if (status.expiresAt < new Date()) {
      throw new NotFoundException('Status has expired');
    }

    if (status.userId !== userId) {
      await this.checkStatusPrivacy(status, userId);
    }

    return status;
  }

  async markAsViewed(statusId: string, viewerId: string): Promise<StatusView> {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      throw new NotFoundException('Status not found');
    }

    if (status.userId === viewerId) {
      throw new ForbiddenException('Cannot view your own status');
    }

    const existingView = await this.prisma.statusView.findUnique({
      where: {
        statusId_viewerId: {
          statusId,
          viewerId,
        },
      },
    });

    if (existingView) {
      return existingView;
    }

    const [view] = await this.prisma.$transaction([
      this.prisma.statusView.create({
        data: {
          statusId,
          viewerId,
        },
        include: {
          viewer: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.status.update({
        where: { id: statusId },
        data: { viewCount: { increment: 1 } },
      }),
    ]);

    return view;
  }

  async getStatusViews(
    statusId: string,
    userId: string,
  ): Promise<StatusView[]> {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      throw new NotFoundException('Status not found');
    }

    if (status.userId !== userId) {
      throw new ForbiddenException('You can only see views on your own status');
    }

    const views = await this.prisma.statusView.findMany({
      where: { statusId },
      include: {
        viewer: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            lastSeen: true,
            isOnline: true,
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
    });

    return views;
  }

  async updatePrivacy(
    statusId: string,
    userId: string,
    dto: UpdateStatusPrivacyDto,
  ): Promise<Status> {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      throw new NotFoundException('Status not found');
    }

    if (status.userId !== userId) {
      throw new ForbiddenException('You can only update your own status');
    }

    const updatedStatus = await this.prisma.status.update({
      where: { id: statusId },
      data: {
        privacy: {
          upsert: {
            create: {
              type: dto.type,
              exceptUserIds: dto.exceptUserIds || [],
              onlyUserIds: dto.onlyUserIds || [],
            },
            update: {
              type: dto.type,
              exceptUserIds: dto.exceptUserIds || [],
              onlyUserIds: dto.onlyUserIds || [],
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        privacy: true,
      },
    });

    return updatedStatus;
  }

  async deleteStatus(
    statusId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      throw new NotFoundException('Status not found');
    }

    if (status.userId !== userId) {
      throw new ForbiddenException('You can only delete your own status');
    }

    await this.prisma.status.delete({
      where: { id: statusId },
    });

    return { message: 'Status deleted successfully' };
  }

  private async checkStatusPrivacy(
    status: StatusWithPrivacy,
    viewerId: string,
  ): Promise<void> {
    const privacy = status.privacy;

    if (!privacy) {
      const isContact = await this.prisma.contact.findFirst({
        where: {
          userId: status.userId,
          contactId: viewerId,
          isBlocked: false,
        },
      });

      if (!isContact) {
        throw new ForbiddenException('You cannot view this status');
      }
      return;
    }

    if (privacy.type === 'ALL') {
      return;
    }

    if (privacy.type === 'CONTACTS') {
      const isContact = await this.prisma.contact.findFirst({
        where: {
          userId: status.userId,
          contactId: viewerId,
          isBlocked: false,
        },
      });

      if (!isContact) {
        throw new ForbiddenException('You cannot view this status');
      }
      return;
    }

    if (privacy.type === 'EXCEPT') {
      if (privacy.exceptUserIds.includes(viewerId)) {
        throw new ForbiddenException('You cannot view this status');
      }
      return;
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpiredStatuses(): Promise<void> {
    const deleted = await this.prisma.status.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    console.log(`🗑️ Deleted ${deleted.count} expired statuses`);
  }
}
