'use client';

import { useEffect, useState } from 'react';

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
  const [assessments, setAssessments] = useState<HealthAssessment[]>([]);
  const [riskLevel, setRiskLevel] = useState('');
  const [summary, setSummary] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!petId) {
      setAssessments([]);
      return;
    }

    setIsLoadingAssessments(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/health-assessments?petId=${encodeURIComponent(petId)}`,
      );
      const result = (await response.json()) as HealthAssessment[] | ApiError;

      if (!response.ok || !Array.isArray(result)) {
        throw new Error(
          'error' in result && result.error
            ? result.error
            : '读取健康评估记录失败，请稍后重试',
        );
      }

      setAssessments(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '读取健康评估记录失败，请稍后重试',
      );
    } finally {
      setIsLoadingAssessments(false);
    }
  }

  useEffect(() => {
    void loadPets();
  }, []);

  useEffect(() => {
    void loadAssessments(selectedPetId);
  }, [selectedPetId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/health-assessments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          petId: selectedPetId,
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

      setAssessments((currentAssessments) => [
        result as HealthAssessment,
        ...currentAssessments,
      ]);
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

  return (
    <section className="registration-card" aria-labelledby="assessment-title">
      <div className="section-heading">
        <div>
          <h2 id="assessment-title">健康评估记录</h2>
          <p className="section-description">
            记录初步风险提示和观察摘要，不代表医学风险评分或疾病诊断。
          </p>
        </div>
        <button className="secondary-button" type="button" onClick={loadPets}>
          刷新宠物
        </button>
      </div>

      {isLoadingPets ? <p className="muted-message">正在读取宠物信息…</p> : null}

      {!isLoadingPets && pets.length === 0 ? (
        <p className="muted-message">请先录入一只宠物，再添加健康评估记录。</p>
      ) : null}

      {pets.length > 0 ? (
        <>
          <form className="pet-form assessment-form" onSubmit={handleSubmit}>
            <label>
              选择宠物
              <select
                required
                value={selectedPetId}
                onChange={(event) => setSelectedPetId(event.target.value)}
              >
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}（{pet.species}，{pet.age} 岁）
                  </option>
                ))}
              </select>
            </label>

            <label>
              初步风险提示
              <input
                required
                value={riskLevel}
                onChange={(event) => setRiskLevel(event.target.value)}
                placeholder="例如：待观察"
              />
            </label>

            <label>
              观察摘要
              <textarea
                required
                rows={4}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="记录当前观察到的信息"
              />
            </label>

            <button type="submit" disabled={isSubmitting || !selectedPetId}>
              {isSubmitting ? '保存中…' : '保存评估记录'}
            </button>
          </form>

          <div className="assessment-list" aria-live="polite">
            <h3>已保存记录</h3>
            {isLoadingAssessments ? (
              <p className="muted-message">正在读取评估记录…</p>
            ) : assessments.length === 0 ? (
              <p className="muted-message">该宠物暂时没有健康评估记录。</p>
            ) : (
              assessments.map((assessment) => (
                <article className="assessment-item" key={assessment.id}>
                  <div className="assessment-meta">
                    <strong>{assessment.riskLevel}</strong>
                    <time dateTime={assessment.createdAt}>
                      {new Date(assessment.createdAt).toLocaleString('zh-CN')}
                    </time>
                  </div>
                  <p>{assessment.summary}</p>
                </article>
              ))
            )}
          </div>
        </>
      ) : null}

      {errorMessage ? (
        <p className="feedback error-message" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
