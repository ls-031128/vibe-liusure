import PetRegistrationForm from './pet-registration-form';
import HealthAssessmentPanel from './health-assessment-panel';

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Day 3 · 核心闭环 1</p>
        <h1 id="page-title">宠物健康平台 MVP</h1>
        <p className="description">
          面向普通宠物主人的健康信息辅助工具，帮助整理宠物异常信息，并提供初步风险提示、观察建议和就医提醒。
        </p>
        <p className="status" role="status">
          当前处于开发阶段，本页面先支持宠物基本信息录入和本地保存。
        </p>
        <PetRegistrationForm />
        <HealthAssessmentPanel />
      </section>
    </main>
  );
}
