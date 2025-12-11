import { $Enums, User } from '@prisma/client';

export type Gender = $Enums.Gender;

export type { User } from '@prisma/client';

export interface UserWithPassword extends User {
  password: string;
}

export interface JwtPayload {
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}
