import assert from 'node:assert/strict';
import test from 'node:test';

import { GET, POST } from '../app/api/pets/route.ts';
import prisma from '../lib/prisma.ts';

test('POST /api/pets creates and returns a pet', async () => {
  const payload = {
    name: `测试宠物-${Date.now()}`,
    species: '猫',
    age: 3,
  };

  const response = await POST(
    new Request('http://localhost/api/pets', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );

  assert.equal(response.status, 201);
  const created = await response.json();

  assert.equal(created.name, payload.name);
  assert.equal(created.species, payload.species);
  assert.equal(created.age, payload.age);
  assert.equal(typeof created.id, 'string');
  assert.equal(typeof created.createdAt, 'string');

  const stored = await prisma.pet.findUnique({ where: { id: created.id } });
  assert.deepEqual(stored && {
    id: stored.id,
    name: stored.name,
    species: stored.species,
    age: stored.age,
  }, {
    id: created.id,
    name: payload.name,
    species: payload.species,
    age: payload.age,
  });

  await prisma.pet.delete({ where: { id: created.id } });
});

test('POST /api/pets rejects invalid pet data', async () => {
  const response = await POST(
    new Request('http://localhost/api/pets', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '', species: '猫', age: -1 }),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: '宠物名称、物种和年龄格式不正确',
  });
});

test('GET /api/pets returns saved pets', async () => {
  const pet = await prisma.pet.create({
    data: {
      id: `test-pet-${Date.now()}`,
      name: '列表测试宠物',
      species: '狗',
      age: 5,
    },
  });

  try {
    const response = await GET();

    assert.equal(response.status, 200);
    const pets = await response.json();
    assert.equal(pets.some((item: { id: string }) => item.id === pet.id), true);
  } finally {
    await prisma.pet.delete({ where: { id: pet.id } });
  }
});
