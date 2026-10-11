import assert from 'node:assert/strict';
import test from 'node:test';

const originalDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = 'postgresql://127.0.0.1:5432/pet_health_unit_test';

const [{ POST: createPet }, { GET: getAssessments, POST: createAssessment }] =
  await Promise.all([
    import('../app/api/pets/route.ts'),
    import('../app/api/health-assessments/route.ts'),
  ]);

if (originalDatabaseUrl === undefined) {
  delete process.env.DATABASE_URL;
} else {
  process.env.DATABASE_URL = originalDatabaseUrl;
}

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('POST /api/pets rejects an empty required name', async () => {
  const response = await createPet(
    jsonRequest('http://localhost/api/pets', {
      name: '   ',
      species: '猫',
      age: 3,
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: '宠物名称、物种和年龄格式不正确',
  });
});

test('POST /api/pets rejects a non-integer age', async () => {
  const response = await createPet(
    jsonRequest('http://localhost/api/pets', {
      name: '小白',
      species: '猫',
      age: 1.5,
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: '宠物名称、物种和年龄格式不正确',
  });
});

test('GET /api/health-assessments requires petId', async () => {
  const response = await getAssessments(
    new Request('http://localhost/api/health-assessments'),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'petId 不能为空' });
});

test('POST /api/health-assessments rejects missing and empty required values', async (t) => {
  const invalidPayloads = [
    {
      name: 'missing petId with other fields valid',
      payload: { riskLevel: '待观察', summary: '继续观察' },
    },
    {
      name: 'missing summary',
      payload: { petId: 'pet-1', riskLevel: '待观察' },
    },
    {
      name: 'empty riskLevel',
      payload: { petId: 'pet-1', riskLevel: ' ', summary: '继续观察' },
    },
  ];

  for (const { name, payload } of invalidPayloads) {
    await t.test(name, async () => {
      const response = await createAssessment(
        jsonRequest('http://localhost/api/health-assessments', payload),
      );

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error: '宠物、初步风险提示和摘要不能为空',
      });
    });
  }
});
