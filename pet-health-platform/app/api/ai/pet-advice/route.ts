import { getAiPetAdvice } from '../../../../lib/ai-pet-advice.ts';
import prisma from '../../../../lib/prisma.ts';

export const runtime = 'nodejs';

function json(data: unknown, status: number) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: '请求体必须是有效的 JSON' }, 400);
  }

  const input = typeof body === 'object' && body !== null && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {};
  const petId = typeof input.petId === 'string' ? input.petId.trim() : '';
  const question = typeof input.question === 'string' ? input.question.trim() : '';
  if (!petId) return json({ error: 'petId 不能为空' }, 400);
  if (!question) return json({ error: 'question 不能为空' }, 400);
  if (question.length > 2000) {
    return json({ error: '问题请控制在 2000 字以内' }, 400);
  }

  try {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      select: { id: true, name: true, species: true, age: true },
    });
    if (!pet) return json({ error: '宠物不存在' }, 404);

    const assessments = await prisma.healthAssessment.findMany({
      where: { petId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { riskLevel: true, summary: true, createdAt: true },
    });
    const answer = await getAiPetAdvice({
      pet: { name: pet.name, species: pet.species, age: pet.age },
      assessments,
      question,
    });
    return json({ answer }, 200);
  } catch {
    return json({ error: 'AI服务暂时不可用，请稍后重试' }, 503);
  }
}
