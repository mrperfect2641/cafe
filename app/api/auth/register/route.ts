import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Role } from '@/app/generated/prisma/client';

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(6).max(72),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { name, email, password } = registerSchema.parse(json);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: Role.STAFF,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: 'Unable to register user' }, { status: 500 });
  }
}
