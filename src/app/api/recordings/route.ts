import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  const recordings = await prisma.recording.findMany({
    include: { question: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(recordings);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const questionId = formData.get('questionId') as string;
  const transcript = formData.get('transcript') as string;
  const duration = parseInt(formData.get('duration') as string) || 0;
  const audioBlob = formData.get('audio') as Blob | null;

  let audioUrl: string | null = null;

  if (audioBlob) {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const filename = `recording-${Date.now()}.webm`;
    const filepath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    await writeFile(filepath, buffer);
    audioUrl = `/uploads/${filename}`;
  }

  const recording = await prisma.recording.create({
    data: {
      questionId,
      transcript,
      duration,
      audioUrl,
    },
    include: { question: true },
  });

  return NextResponse.json(recording);
}
