import { FastifyRequest, FastifyReply } from 'fastify';
import { otp } from '../auth/otp.js';
import { signJWT } from '../auth/jwt.js';

export async function requestOTPHandler(_req: FastifyRequest, reply: FastifyReply) {
  const { wa } = _req.body as { wa: string };
  otp.requestOTP(wa);
  reply.status(204).send();
}

export async function verifyOTPHandler(_req: FastifyRequest, reply: FastifyReply) {
  const { wa, code } = _req.body as { wa: string; code: string };
  try {
    const ok = await otp.verifyOTP(wa, code);
    if (!ok) return reply.status(401).send({ error: 'invalid_code' });
  } catch (err) {
    const e = err as { statusCode?: number };
    return reply.status(e.statusCode ?? 400).send({ error: 'wa_not_found' });
  }
  const token = await signJWT({ wa, role: 'penerima' }, 900);
  reply.send({ token });
}
