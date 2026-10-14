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
    <section id="ai-assistant" className="surface-card scroll-mt-6" aria-labelledby="ai-advice-title">
      <div className="section-heading">
        <div><p className="eyebrow">03 / AI ASSISTANT</p><h2 id="ai-advice-title">AI 健康助手</h2></div>
        <span className="badge">DeepSeek</span>
      </div>
      <p className="section-description">结合当前宠物资料与最近记录，整理日常护理和观察建议。</p>
      <div className="mb-5" aria-live="polite" aria-busy={isSubmitting}>
        {!answer && !isSubmitting && !error ? (
          <div className="empty-state"><span className="empty-symbol" aria-hidden="true">✧</span><p className="font-medium">向 AI 咨询宠物健康问题</p><small>例如：最近活动变少，我可以记录哪些观察信息？</small></div>
        ) : null}
        {isSubmitting ? (
          <div className="flex min-h-32 items-center justify-center gap-3 rounded-xl bg-teal-50/50 text-sm text-teal-800" role="status">
            <span className="flex gap-1" aria-hidden="true"><span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" /></span>
            AI 正在整理建议，请稍候…
          </div>
        ) : null}
        {answer ? <div><p className="mb-2 text-xs font-medium text-teal-800">✧ AI 的建议</p><p className="ai-answer">{answer}</p></div> : null}
        {error ? <p className="feedback error-message" role="alert">{error}</p> : null}
      </div>
      <form className="pet-form" onSubmit={handleSubmit}>
        <label htmlFor="ai-question">你的问题</label>
        <textarea id="ai-question" required maxLength={2000} rows={3} value={question} disabled={isSubmitting}
          onChange={(event) => setQuestion(event.target.value)} placeholder="描述你观察到的变化，尽量具体一些…" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">{question.length} / 2000</span>
          <button type="submit" disabled={isSubmitting || !question.trim()}>{isSubmitting ? '正在获取建议…' : '发送问题 →'}</button>
        </div>
      </form>
      <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-xs leading-6 text-amber-900">
        AI 建议存在不确定性，不能替代兽医诊断。评估记录由用户手动填写；情况严重或持续恶化时请咨询兽医。
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-500">提交后，当前宠物资料、最近评估记录和问题会发送至 DeepSeek。请勿输入个人身份信息；本平台不保存问题和 AI 回复。</p>
    </section>
  );
}
