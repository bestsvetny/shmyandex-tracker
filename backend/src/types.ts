// Расширяем типы Fastify для authenticate-декоратора и JWT-payload
import { FastifyRequest, FastifyReply } from 'fastify';

export interface JWTPayload {
  id: number;
  email: string;
  name: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}
