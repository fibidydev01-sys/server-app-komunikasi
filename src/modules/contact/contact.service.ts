import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async getContacts(userId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: {
        userId,
        isBlocked: false,
      },
      include: {
        contact: {
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

    return contacts;
  }

  async blockContact(userId: string, contactId: string) {
    if (userId === contactId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const contact = await this.prisma.contact.findFirst({
      where: {
        userId,
        contactId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.isBlocked) {
      throw new BadRequestException('Contact is already blocked');
    }

    await this.prisma.contact.update({
      where: { id: contact.id },
      data: { isBlocked: true },
    });

    return { message: 'Contact blocked successfully' };
  }

  async unblockContact(userId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        userId,
        contactId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (!contact.isBlocked) {
      throw new BadRequestException('Contact is not blocked');
    }

    await this.prisma.contact.update({
      where: { id: contact.id },
      data: { isBlocked: false },
    });

    return { message: 'Contact unblocked successfully' };
  }

  async removeContact(userId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        userId,
        contactId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.$transaction([
      this.prisma.contact.delete({
        where: { id: contact.id },
      }),
      this.prisma.contact.deleteMany({
        where: {
          userId: contactId,
          contactId: userId,
        },
      }),
    ]);

    return { message: 'Contact removed successfully' };
  }

  async getBlockedContacts(userId: string) {
    const blockedContacts = await this.prisma.contact.findMany({
      where: {
        userId,
        isBlocked: true,
      },
      include: {
        contact: {
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

    return blockedContacts;
  }

  async updateNickname(
    userId: string,
    contactId: string,
    nickname: string | null,
  ) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        userId,
        contactId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const updatedContact = await this.prisma.contact.update({
      where: { id: contact.id },
      data: { nickname },
      include: {
        contact: {
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

    return updatedContact;
  }

  async isBlocked(userId: string, contactId: string): Promise<boolean> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        OR: [
          { userId, contactId, isBlocked: true },
          { userId: contactId, contactId: userId, isBlocked: true },
        ],
      },
    });

    return !!contact;
  }
}
