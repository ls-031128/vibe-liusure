'use client';

import { useEffect, useRef, useState } from 'react';

import { createRequestVersion } from '../lib/request-version';

export default function AiPetAdvicePanel({ petId }: { petId: string }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requests = useRef(createRequestVersion());
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const versions = requests.current;
    return () => {
      versions.invalidate();
      controller.current?.abort();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || controller.current) return;
    const version = requests.current.next();
    const currentController = new AbortController();
    controller.current = currentController;
    setIsSubmitting(true);
    setError('');
    setAnswer('');

    try {
      const response = await fetch('/api/ai/pet-advice', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ petId, question: question.trim() }),
        signal: currentController.signal,
      });
      const result = await response.json();
      if (!response.ok || typeof result?.answer !== 'string') {
        if (requests.current.isCurrent(version)) {
          setError(typeof result?.error === 'string'
            ? result.error : 'AI服务暂时不可用，请稍后重试');
        }
        return;
      }
      if (requests.current.isCurrent(version)) setAnswer(result.answer);
    } catch {
      if (!currentController.signal.aborted && requests.current.isCurrent(version)) {
        setError('AI服务暂时不可用，请稍后重试');
      }
    } finally {
      if (requests.current.isCurrent(version)) {
        controller.current = null;
        setIsSubmitting(false);
      }
    }
  }

  return (
    <section className="registration-card" aria-labelledby="ai-advice-title">
      <h3 id="ai-advice-title">AI 宠物健康助手</h3>
      <p className="section-description">
        提供日常护理和观察建议，存在不确定性，不能替代兽医诊断。
        评估记录由用户手动填写；情况严重或持续恶化时请咨询兽医。
      </p>
      <p className="muted-message">
        提交后，当前宠物基本资料、最近评估记录和问题会发送至 DeepSeek。
        请勿输入个人身份信息；本平台不保存问题和 AI 回复。
      </p>
      <form className="pet-form" onSubmit={handleSubmit}>
        <label htmlFor="ai-question">宠物健康问题</label>
        <textarea
          id="ai-question"
          required
          maxLength={2000}
          rows={4}
          value={question}
          disabled={isSubmitting}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="例如：最近活动变少，我可以记录哪些观察信息？"
        />
        <button type="submit" disabled={isSubmitting || !question.trim()}>
          {isSubmitting ? '正在获取建议…' : '获取 AI 建议'}
        </button>
      </form>
      <div aria-live="polite" aria-busy={isSubmitting}>
        {isSubmitting ? <p className="muted-message">AI 正在整理建议，请稍候…</p> : null}
        {answer ? <p className="feedback ai-answer">{answer}</p> : null}
        {error ? <p className="feedback error-message" role="alert">{error}</p> : null}
      </div>
    </section>
  );
}
