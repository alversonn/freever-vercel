import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const whereClause = user.username === 'admin' ? {} : { authorId: user.id };

  try {
    const patientCount = await prisma.patientRecord.count({ where: whereClause });

    const diagnosisCounts = await prisma.patientRecord.groupBy({
      by: ['diagnosis'],
      where: whereClause,
      _count: { diagnosis: true },
      orderBy: { _count: { diagnosis: 'desc' } },
    });

    return NextResponse.json({
      patientCount,
      diagnosisCounts,
    });

  } catch (error) {
    console.error("API DASHBOARD ERROR:", error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}