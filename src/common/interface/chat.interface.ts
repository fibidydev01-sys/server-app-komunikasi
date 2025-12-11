export type { Chat, Message, User } from '@prisma/client';

export interface MessageSender {
  id: string;
  name: string;
  avatar: string | null;
}

export interface SocketData {
  userId: string;
}
