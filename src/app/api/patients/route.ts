// app/api/patients/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Fungsi untuk GET (Read All) dengan logging error
export async function GET() {
  try {
    const records = await prisma.patientRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    // INI BAGIAN PENTING: Menampilkan error detail di terminal
    console.error("API GET ERROR:", error); 
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

// Fungsi untuk POST (Create) dengan logging error
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record = await prisma.patientRecord.create({
      data: body,
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    // INI BAGIAN PENTING: Menampilkan error detail di terminal
    console.error("API POST ERROR:", error);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}