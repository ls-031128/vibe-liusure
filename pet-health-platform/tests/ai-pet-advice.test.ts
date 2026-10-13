import assert from 'node:assert/strict';
import test, { after } from 'node:test';

const testEnvironment = {
  DATABASE_URL: 'postgresql://127.0.0.1:5432/pet_health_unit_test',
  AI_API_BASE_URL: 'https://api.deepseek.com',
  AI_API_KEY: 'unit-test-key',
  AI_MODEL: 'deepseek-flash',
};
const originalEnvironment = Object.fromEntries(
  Object.keys(testEnvironment).map((key) => [key, process.env[key]]),
);
Object.assign(process.env, testEnvironment);

const { POST } = await import('../app/api/ai/pet-advice/route.ts');
const { default: prisma } = await import('../lib/prisma.ts');

after(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const pet = { id: 'pet-1', name: '小白', species: '猫', age: 3 };
const assessments = [
  {
    riskLevel: '需要咨询兽医',
    summary: '食欲减少，由主人手动记录，尚未由兽医确认。',
    createdAt: new Date('2026-10-13T01:00:00Z'),
  },
  {
    riskLevel: '待观察',
    summary: '昨日活动较少。',
    createdAt: new Date('2026-10-12T01:00:00Z'),
  },
];

function request(body: unknown) {
  return new Request('http://localhost/api/ai/pet-advice', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Prisma delegates expose functions through a Proxy, while their property
// descriptors have undefined values. Node's mock.method cannot handle that.
// Replace only the database query boundary and restore it after each test.
function replaceQuery(
  t: test.TestContext,
  target: object,
  method: string,
  implementation: (query: unknown) => unknown,
) {
  const delegate = target as Record<string, unknown>;
  const original = delegate[method];
  delegate[method] = implementation;
  t.after(() => { delegate[method] = original; });
}

function context(t: test.TestContext, records = assessments) {
  replaceQuery(t, prisma.pet, 'findUnique', async (query: unknown) => {
    assert.deepEqual(query, {
      where: { id: pet.id },
      select: { id: true, name: true, species: true, age: true },
    });
    return pet;
  });
  replaceQuery(t, prisma.healthAssessment, 'findMany', async (query: unknown) => {
    assert.deepEqual(query, {
      where: { petId: pet.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { riskLevel: true, summary: true, createdAt: true },
    });
    return records;
  });
}

function preventExternalCalls(t: test.TestContext) {
  const unexpectedCall = () => assert.fail('Invalid input must not query a database or AI');
  replaceQuery(t, prisma.pet, 'findUnique', unexpectedCall);
  replaceQuery(t, prisma.healthAssessment, 'findMany', unexpectedCall);
  t.mock.method(globalThis, 'fetch', unexpectedCall);
}

test('POST /api/ai/pet-advice rejects missing petId before querying dependencies', async (t) => {
  preventExternalCalls(t);
  const response = await POST(request({ question: '如何记录食欲变化？' }));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'petId 不能为空' });
});

test('POST /api/ai/pet-advice rejects missing question before querying dependencies', async (t) => {
  preventExternalCalls(t);
  const response = await POST(request({ petId: pet.id }));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'question 不能为空' });
});

test('POST /api/ai/pet-advice rejects blank questions and oversized input', async (t) => {
  preventExternalCalls(t);
  for (const question of ['   ', '问'.repeat(2001)]) {
    const response = await POST(request({ petId: pet.id, question }));
    assert.equal(response.status, 400);
  }
});

test('POST /api/ai/pet-advice reports an unknown pet without calling AI', async (t) => {
  replaceQuery(t, prisma.pet, 'findUnique', async () => null);
  replaceQuery(t, prisma.healthAssessment, 'findMany', () => assert.fail('No assessments for an unknown pet'));
  t.mock.method(globalThis, 'fetch', () => assert.fail('No AI call for an unknown pet'));
  const response = await POST(request({ petId: pet.id, question: '如何护理？' }));
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: '宠物不存在' });
});

test('POST /api/ai/pet-advice sends current pet and recent manual records to DeepSeek', async (t) => {
  context(t);
  t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    assert.equal(url, 'https://api.deepseek.com/chat/completions');
    assert.equal(options.method, 'POST');
    assert.equal(new Headers(options.headers).get('authorization'), 'Bearer unit-test-key');
    assert.equal(options.signal instanceof AbortSignal, true);
    const body = JSON.parse(options.body as string);
    assert.equal(body.model, 'deepseek-flash');
    assert.equal(body.stream, false);
    assert.equal(body.messages[0].role, 'system');
    assert.match(body.messages[0].content, /不.*诊断/);
    assert.match(body.messages[0].content, /兽医/);
    assert.match(body.messages[0].content, /药物剂量/);
    assert.deepEqual(JSON.parse(body.messages[1].content), {
      pet: { name: '小白', age: 3, species: '猫', breed: '未记录' },
      latestRiskLevel: '需要咨询兽医',
      assessmentSource: '用户手动填写，未经兽医诊断确认',
      history: assessments.map((record) => ({ ...record, createdAt: record.createdAt.toISOString() })),
      question: '如何记录食欲变化？',
    });
    return Response.json({ choices: [{ message: { content: '记录饮食与活动变化，向兽医提供观察信息。' } }] });
  });
  const response = await POST(request({ petId: pet.id, question: '如何记录食欲变化？' }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(Object.keys(result), ['answer']);
  assert.match(result.answer, /记录饮食与活动变化/);
  assert.match(result.answer, /不确定性/);
  assert.equal(result.answer.includes('unit-test-key'), false);
});

test('POST /api/ai/pet-advice explicitly marks missing assessment context', async (t) => {
  context(t, []);
  t.mock.method(globalThis, 'fetch', async (_url: string, options: RequestInit) => {
    const input = JSON.parse(JSON.parse(options.body as string).messages[1].content);
    assert.equal(input.latestRiskLevel, '未记录');
    assert.deepEqual(input.history, []);
    return Response.json({ choices: [{ message: { content: '请补充观察信息。' } }] });
  });
  const response = await POST(request({ petId: pet.id, question: '需要观察什么？' }));
  assert.equal(response.status, 200);
  assert.match((await response.json()).answer, /请补充观察信息/);
});

test('POST /api/ai/pet-advice maps AI failures to a friendly response without leaking details', async (t) => {
  const failures = [
    { name: 'invalid API key', fail: () => Response.json({ error: 'secret provider error' }, { status: 401 }) },
    { name: 'insufficient balance', fail: () => Response.json({ error: 'secret provider error' }, { status: 402 }) },
    { name: 'network failure', fail: () => { throw new Error('private network information'); } },
    { name: 'timeout', fail: () => { throw new DOMException('private timeout information', 'TimeoutError'); } },
    { name: 'empty completion', fail: () => Response.json({ choices: [{ message: { content: ' ' } }] }) },
  ];
  for (const failure of failures) {
    await t.test(failure.name, async (subtest) => {
      context(subtest);
      subtest.mock.method(globalThis, 'fetch', async () => failure.fail());
      const response = await POST(request({ petId: pet.id, question: '如何护理？' }));
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: 'AI服务暂时不可用，请稍后重试' });
    });
  }
});

test('POST /api/ai/pet-advice handles an unconfigured key without sending a request', async (t) => {
  context(t);
  const savedKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = '';
  t.after(() => { process.env.AI_API_KEY = savedKey; });
  t.mock.method(globalThis, 'fetch', () => assert.fail('No network call without an API key'));
  const response = await POST(request({ petId: pet.id, question: '如何护理？' }));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'AI服务暂时不可用，请稍后重试' });
});
