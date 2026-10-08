import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GET,
  POST,
} from '../app/api/health-assessments/route.ts';
import prisma from '../lib/prisma.ts';

test('POST /api/health-assessments persists and GET returns a record', async () => {
  const pet = await prisma.pet.create({
    data: {
      id: `assessment-pet-${Date.now()}`,
      name: '评估测试宠物',
      species: '猫',
      age: 4,
    },
  });

  try {
    const payload = {
      petId: pet.id,
      riskLevel: '待观察',
      summary: '记录当前状态，后续继续观察。',
    };
    const createResponse = await POST(
      new Request('http://localhost/api/health-assessments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );

    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();
    assert.equal(created.petId, pet.id);
    assert.equal(created.riskLevel, payload.riskLevel);
    assert.equal(created.summary, payload.summary);
    assert.equal(typeof created.id, 'string');

    const stored = await prisma.healthAssessment.findUnique({
      where: { id: created.id },
    });
    assert.deepEqual(stored && {
      id: stored.id,
      petId: stored.petId,
      riskLevel: stored.riskLevel,
      summary: stored.summary,
    }, {
      id: created.id,
      petId: pet.id,
      riskLevel: payload.riskLevel,
      summary: payload.summary,
    });

    const listResponse = await GET(
      new Request(`http://localhost/api/health-assessments?petId=${pet.id}`),
    );
    assert.equal(listResponse.status, 200);
    const records = await listResponse.json();
    assert.equal(records.length, 1);
    assert.equal(records[0].id, created.id);
  } finally {
    await prisma.healthAssessment.deleteMany({ where: { petId: pet.id } });
    await prisma.pet.delete({ where: { id: pet.id } });
  }
});

test('POST /api/health-assessments rejects invalid data', async () => {
  const response = await POST(
    new Request('http://localhost/api/health-assessments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ petId: '', riskLevel: '', summary: '' }),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: '宠物、初步风险提示和摘要不能为空',
  });
});

test('GET /api/health-assessments requires a petId', async () => {
  const response = await GET(
    new Request('http://localhost/api/health-assessments'),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'petId 不能为空',
  });
});
