'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

type SavedPet = {
  id: string;
  name: string;
  species: string;
  age: number;
  createdAt: string;
};

type ApiError = {
  error?: string;
};

export default function PetRegistrationForm() {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState('');
  const [savedPet, setSavedPet] = useState<SavedPet | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSavedPet(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          species,
          age: Number(age),
        }),
      });
      const result = (await response.json()) as SavedPet | ApiError;

      if (!response.ok) {
        throw new Error(
          'error' in result && result.error
            ? result.error
            : '保存宠物信息失败，请稍后重试',
        );
      }

      setSavedPet(result as SavedPet);
      setName('');
      setSpecies('');
      setAge('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '保存宠物信息失败，请稍后重试',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="registration-card" aria-labelledby="registration-title">
      <h2 id="registration-title">录入宠物基本信息</h2>
      <p className="section-description">
        先保存宠物名称、物种和年龄，后续健康信息功能将在此基础上逐步完善。
      </p>

      <form className="pet-form" onSubmit={handleSubmit}>
        <label>
          宠物名称
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：团团"
          />
        </label>

        <label>
          物种
          <input
            required
            value={species}
            onChange={(event) => setSpecies(event.target.value)}
            placeholder="例如：猫"
          />
        </label>

        <label>
          年龄
          <input
            required
            min="0"
            step="1"
            type="number"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            placeholder="例如：3"
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中…' : '保存宠物信息'}
        </button>
      </form>

      {errorMessage ? (
        <p className="feedback error-message" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {savedPet ? (
        <div className="feedback success-message" role="status">
          <strong>保存成功</strong>
          <p>
            {savedPet.name}（{savedPet.species}，{savedPet.age} 岁）已保存。
          </p>
        </div>
      ) : null}
    </section>
  );
}
