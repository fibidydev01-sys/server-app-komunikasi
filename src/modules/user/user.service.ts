import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(currentUserId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          not: currentUserId,
        },
      },
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

    return users;
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    return user;
  }

  async searchUser(query: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: query }, { id: query }],
      },
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

    return user;
  }

  async updateOnlineStatus(userId: string, isOnline: boolean) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeen: isOnline ? null : new Date(),
      },
    });
  }

  async updateLastSeen(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastSeen: new Date(),
      },
    });
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    return !user;
  }

  async updateUsername(userId: string, username: string) {
    const isAvailable = await this.isUsernameAvailable(username);

    if (!isAvailable) {
      throw new Error('Username is already taken');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { username },
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

    return user;
  }
}
