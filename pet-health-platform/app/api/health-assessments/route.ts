import { randomUUID } from 'node:crypto';

import prisma from '../../../lib/prisma.ts';

type CreateHealthAssessmentBody = {
  petId?: unknown;
  riskLevel?: unknown;
  summary?: unknown;
};

function isCreateHealthAssessmentBody(
  value: unknown,
): value is CreateHealthAssessmentBody {
  return typeof value === 'object' && value !== null;
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: '请求体必须是有效的 JSON' }, 400);
  }

  if (!isCreateHealthAssessmentBody(body)) {
    return json({ error: '宠物、初步风险提示和摘要不能为空' }, 400);
  }

  const petId = typeof body.petId === 'string' ? body.petId.trim() : '';
  const riskLevel =
    typeof body.riskLevel === 'string' ? body.riskLevel.trim() : '';
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';

  if (petId.length === 0 || riskLevel.length === 0 || summary.length === 0) {
    return json({ error: '宠物、初步风险提示和摘要不能为空' }, 400);
  }

  try {
    const pet = await prisma.pet.findUnique({ where: { id: petId } });

    if (!pet) {
      return json({ error: '宠物不存在' }, 404);
    }

    const assessment = await prisma.healthAssessment.create({
      data: {
        id: randomUUID(),
        petId,
        riskLevel,
        summary,
      },
    });

    return json(assessment, 201);
  } catch (error) {
    console.error('Failed to create health assessment', error);
    return json({ error: '保存健康评估记录失败，请稍后重试' }, 500);
  }
}

export async function GET(request: Request) {
  const petId = new URL(request.url).searchParams.get('petId')?.trim();

  if (!petId) {
    return json({ error: 'petId 不能为空' }, 400);
  }

  try {
    const pet = await prisma.pet.findUnique({ where: { id: petId } });

    if (!pet) {
      return json({ error: '宠物不存在' }, 404);
    }

    const assessments = await prisma.healthAssessment.findMany({
      where: { petId },
      orderBy: { createdAt: 'desc' },
    });

    return json(assessments, 200);
  } catch (error) {
    console.error('Failed to list health assessments', error);
    return json({ error: '读取健康评估记录失败，请稍后重试' }, 500);
  }
}
