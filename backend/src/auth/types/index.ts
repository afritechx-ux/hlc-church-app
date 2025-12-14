import { Role } from '@prisma/client';

export * from './tokens.type';
export type JwtPayload = {
    sub: string;
    email: string;
    role: Role;
};

export type JwtPayloadWithRt = JwtPayload & { refreshToken: string };
