import { randomUUID } from 'node:crypto';

import prisma from '../../../lib/prisma.ts';

type CreatePetBody = {
  name?: unknown;
  species?: unknown;
  age?: unknown;
};

function isCreatePetBody(value: unknown): value is CreatePetBody {
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

  if (!isCreatePetBody(body)) {
    return json({ error: '宠物名称、物种和年龄格式不正确' }, 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const species = typeof body.species === 'string' ? body.species.trim() : '';
  const age = body.age;

  if (
    name.length === 0 ||
    species.length === 0 ||
    typeof age !== 'number' ||
    !Number.isInteger(age) ||
    age < 0
  ) {
    return json({ error: '宠物名称、物种和年龄格式不正确' }, 400);
  }

  try {
    const pet = await prisma.pet.create({
      data: {
        id: randomUUID(),
        name,
        species,
        age,
      },
    });

    return json(pet, 201);
  } catch (error) {
    console.error('Failed to create pet', error);
    return json({ error: '保存宠物信息失败，请稍后重试' }, 500);
  }
}
