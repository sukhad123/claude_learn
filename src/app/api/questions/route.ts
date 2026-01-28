import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const questions = await prisma.question.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: 'asc' },
  });
 

  return NextResponse.json(questions);
}
