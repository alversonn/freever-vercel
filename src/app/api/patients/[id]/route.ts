// app/api/patients/[id]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// FUNGSI UNTUK MENGAMBIL SATU DATA PASIEN (GET)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const record = await prisma.patientRecord.findUnique({
      where: { id: id },
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("API GET (SINGLE) ERROR:", error);
    return NextResponse.json({ error: 'Failed to fetch record' }, { status: 500 });
  }
}

// FUNGSI UNTUK MEMPERBARUI DATA PASIEN (PUT)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const updatedRecord = await prisma.patientRecord.update({
      where: { id: id },
      data: body,
    });
    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error("API PUT ERROR:", error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

// FUNGSI UNTUK MENGHAPUS DATA PASIEN (DELETE) - sudah ada sebelumnya
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.patientRecord.delete({
      where: { id: id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("API DELETE ERROR:", error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}