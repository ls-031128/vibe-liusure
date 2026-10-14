'use client';

import { useEffect, useRef, useState } from 'react';

import { createRequestVersion } from '../lib/request-version';
import AiPetAdvicePanel from './ai-pet-advice-panel';
import HealthAssessmentCharts from './health-assessment-charts';
import PetRegistrationForm from './pet-registration-form';

type Pet = {
  id: string;
  name: string;
  species: string;
  age: number;
};

type HealthAssessment = {
  id: string;
  petId: string;
  riskLevel: string;
  summary: string;
  createdAt: string;
};

type ApiError = {
  error?: string;
};

export default function HealthAssessmentPanel() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [assessmentData, setAssessmentData] = useState<{
    petId: string;
    records: HealthAssessment[];
  }>({ petId: '', records: [] });
  const [riskLevel, setRiskLevel] = useState('');
  const [summary, setSummary] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedPetIdRef = useRef(selectedPetId);
  const assessmentRequests = useRef(createRequestVersion());
  const assessmentAbortController = useRef<AbortController | null>(null);
  selectedPetIdRef.current = selectedPetId;
  const assessments =
    assessmentData.petId === selectedPetId ? assessmentData.records : [];

  async function loadPets() {
    setIsLoadingPets(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/pets');
      const result = (await response.json()) as Pet[] | ApiError;

      if (!response.ok || !Array.isArray(result)) {
        throw new Error(
          'error' in result && result.error
            ? result.error
            : '读取宠物信息失败，请稍后重试',
        );
      }

      setPets(result);
      setSelectedPetId((currentPetId) => {
        if (currentPetId && result.some((pet) => pet.id === currentPetId)) {
          return currentPetId;
        }
        return result[0]?.id ?? '';
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '读取宠物信息失败，请稍后重试',
      );
    } finally {
      setIsLoadingPets(false);
    }
  }

  async function loadAssessments(petId: string) {
    const requestVersion = assessmentRequests.current.next();
    assessmentAbortController.current?.abort();
    assessmentAbortController.current = null;
    setAssessmentData({ petId, records: [] });

    if (!petId) {
      setIsLoadingAssessments(false);
      return;
    }

    const abortController = new AbortController();
    assessmentAbortController.current = abortController;
    setIsLoadingAssessments(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/health-assessments?petId=${encodeURIComponent(petId)}`,
        { signal: abortController.signal },
      );
      const result = (await response.json()) as HealthAssessment[] | ApiError;

      if (!response.ok || !Array.isArray(result)) {
        throw new Error(
          'error' in result && result.error
            ? result.error
            : '读取健康评估记录失败，请稍后重试',
        );
      }

      if (
        !assessmentRequests.current.isCurrent(requestVersion) ||
        selectedPetIdRef.current !== petId
      ) {
        return;
      }

      setAssessmentData({ petId, records: result });
    } catch (error) {
      if (
        abortController.signal.aborted ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        return;
      }

      if (
        !assessmentRequests.current.isCurrent(requestVersion) ||
        selectedPetIdRef.current !== petId
      ) {
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : '读取健康评估记录失败，请稍后重试',
      );
    } finally {
      if (
        assessmentRequests.current.isCurrent(requestVersion) &&
        selectedPetIdRef.current === petId
      ) {
        setIsLoadingAssessments(false);
        if (assessmentAbortController.current === abortController) {
          assessmentAbortController.current = null;
        }
      }
    }
  }

  useEffect(() => {
    void loadPets();
  }, []);

  useEffect(() => {
    void loadAssessments(selectedPetId);

    return () => {
      assessmentRequests.current.invalidate();
      assessmentAbortController.current?.abort();
      assessmentAbortController.current = null;
    };
  }, [selectedPetId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedPetId = selectedPetId;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/health-assessments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          petId: submittedPetId,
          riskLevel,
          summary,
        }),
      });
      const result = (await response.json()) as HealthAssessment | ApiError;

      if (!response.ok) {
        throw new Error(
          'error' in result && result.error
            ? result.error
            : '保存健康评估记录失败，请稍后重试',
        );
      }

      if (selectedPetIdRef.current === submittedPetId) {
        assessmentRequests.current.invalidate();
        assessmentAbortController.current?.abort();
        assessmentAbortController.current = null;
        setIsLoadingAssessments(false);
        setAssessmentData((currentData) => ({
          petId: submittedPetId,
          records: [
            result as HealthAssessment,
            ...(currentData.petId === submittedPetId ? currentData.records : []),
          ],
        }));
      }
      setRiskLevel('');
      setSummary('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '保存健康评估记录失败，请稍后重试',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedPet = pets.find((pet) => pet.id === selectedPetId);
  return (
    <>
      <section className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">PET HEALTH · 让每一份关心都有记录</p>
          <h1 id="page-title" className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">更了解它，<br className="sm:hidden" />更安心地陪伴。</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">宠物健康平台 MVP：整理日常观察、回顾健康记录，借助 AI 获取护理与观察建议。</p>
          <p className="mt-4 inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs text-teal-800">健康信息辅助工具 · 不替代兽医诊断</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="stat-card"><span className="text-sm text-slate-500">我的宠物</span><strong className="stat-value">{isLoadingPets || (errorMessage && pets.length === 0) ? '—' : pets.length}<small>只</small></strong><p className="text-xs text-slate-500">已保存的宠物资料</p></div>
          <div className="stat-card"><span className="text-sm text-slate-500">当前宠物评估</span><strong className="stat-value">{isLoadingAssessments || !selectedPetId || errorMessage ? '—' : assessments.length}<small>条</small></strong><p className="truncate text-xs text-slate-500">{selectedPet ? selectedPet.name + '的健康记录' : '选择宠物后查看'}</p></div>
        </div>
      </section>
      {errorMessage ? <p className="feedback error-message mb-6" role="alert">{errorMessage}</p> : null}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <section id="my-pets" className="surface-card scroll-mt-6" aria-labelledby="pets-title">
          <div className="section-heading">
            <div><p className="eyebrow">01 / PETS</p><h2 id="pets-title">我的宠物</h2></div>
            <button className="secondary-button" type="button" onClick={loadPets}>刷新列表</button>
          </div>
          <p className="section-description">选择一位小伙伴，查看专属健康记录。</p>
          {isLoadingPets ? <p className="empty-state" role="status">正在读取宠物信息…</p> : pets.length === 0 ? (
            <div className="empty-state"><span className="empty-symbol" aria-hidden="true">♡</span><p>{errorMessage ? '暂时无法读取宠物资料' : '还没有宠物资料'}</p><small>{errorMessage ? '请检查连接，稍后刷新列表。' : '从下面的表单开始，记录它的第一份资料。'}</small></div>
          ) : <div className="grid gap-3" aria-label="宠物列表">{pets.map((pet) => (
            <button key={pet.id} type="button" aria-pressed={pet.id === selectedPetId} onClick={() => setSelectedPetId(pet.id)}
              className={'pet-tile ' + (pet.id === selectedPetId ? 'pet-tile-selected' : '')}>
              <span className="pet-avatar" aria-hidden="true">{pet.name.slice(0, 1)}</span>
              <span className="min-w-0 flex-1">
                <strong className="block break-words text-base">{pet.name}</strong>
                <span className="mt-1 block text-xs text-slate-500">{pet.species} · {pet.age} 岁</span>
                <span className="mt-1 block text-xs text-slate-400">品种：未记录</span>
                <span className="badge mt-2">{pet.id === selectedPetId ? '当前查看' : '查看健康记录'}</span>
                {pet.id === selectedPetId && !isLoadingAssessments && assessments[0] ? <span className="mt-2 block break-words text-xs text-slate-600">最近记录提示：{assessments[0].riskLevel}</span> : null}
              </span><span aria-hidden="true" className="text-teal-700">›</span>
            </button>
          ))}</div>}
          <div className="mt-6 border-t border-slate-100 pt-6"><PetRegistrationForm /></div>
        </section>
        <div className="grid min-w-0 gap-6">
          <section id="health-analysis" className="surface-card scroll-mt-6" aria-labelledby="assessment-title">
            <div className="section-heading"><div><p className="eyebrow">02 / HEALTH</p><h2 id="assessment-title">健康风险分析</h2></div><span className="badge">手动记录</span></div>
            <p className="section-description">初步风险提示来自用户填写，不代表医学评分或疾病诊断。</p>
            {pets.length > 0 ? (
              <>
                <form className="pet-form" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>选择宠物<select required value={selectedPetId} onChange={(event) => setSelectedPetId(event.target.value)}>
                      {pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}（{pet.species}，{pet.age} 岁）</option>)}
                    </select></label>
                    <label>初步风险提示<input required value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)} placeholder="例如：待观察" /></label>
                  </div>
                  <label>观察摘要<textarea required rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="记录食欲、活动、睡眠等实际观察到的信息" /></label>
                  <button className="sm:justify-self-start" type="submit" disabled={isSubmitting || !selectedPetId}>{isSubmitting ? '保存中…' : '保存评估记录'}</button>
                </form>
                <div className="mt-7 border-t border-slate-100 pt-6" aria-live="polite">
                  <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">健康记录时间线</h3><span className="text-xs text-slate-500">{assessments.length} 条记录</span></div>
                  {isLoadingAssessments ? <p className="empty-state" role="status">正在读取评估记录…</p> : assessments.length === 0 ? (
                    <div className="empty-state"><span className="empty-symbol" aria-hidden="true">＋</span><p>开始它的第一份健康记录</p><small>保存观察摘要后，时间线和图表将在这里呈现。</small></div>
                  ) : <div className="grid gap-3">{assessments.map((assessment) => (
                    <article className="assessment-item" key={assessment.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="badge">{assessment.riskLevel}</strong>
                        <time className="text-xs text-slate-500" dateTime={assessment.createdAt}>{new Date(assessment.createdAt).toLocaleString('zh-CN')}</time>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{assessment.summary}</p>
                    </article>
                  ))}</div>}
                </div>
              </>
            ) : <div className="empty-state"><span className="empty-symbol" aria-hidden="true">♡</span><p>健康观察，从认识它开始</p><small>请先录入宠物，再添加评估记录。</small></div>}
          </section>
          <HealthAssessmentCharts assessments={assessments} />
          {selectedPetId ? <AiPetAdvicePanel key={selectedPetId} petId={selectedPetId} /> : (
            <section id="ai-assistant" className="surface-card scroll-mt-6"><p className="eyebrow">03 / AI ASSISTANT</p><h2>AI 健康助手</h2><div className="empty-state"><span className="empty-symbol" aria-hidden="true">✧</span><p>向 AI 咨询宠物健康问题</p><small>先录入并选择宠物，即可获取个性化护理建议。</small></div></section>
          )}
        </div>
      </div>
    </>
  );
}
