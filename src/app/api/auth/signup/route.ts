import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(3),
  birthPlace: z.string().min(1),
  dateOfBirth: z.preprocess(
    (v) => (typeof v === "string" || v instanceof Date ? new Date(v as any) : v),
    z.date()
  ),
  gender: z.enum(["Male", "Female"]),
  institution: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = RegisterSchema.parse(json);

    const exists = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }, { phone: data.phone }],
      },
    });
    if (exists) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await hash(data.password, 10);
    const created = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        birthPlace: data.birthPlace,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        institution: data.institution,
        hashedPassword,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
