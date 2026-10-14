import HealthAssessmentPanel from './health-assessment-panel';
import VisitTracker from './visit-tracker';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">跳转到主要内容</a>
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="宠物健康平台首页">
            <span className="logo-mark" aria-hidden="true">✚</span>
            <span><strong className="block text-lg tracking-tight">宠物健康平台</strong><span className="block text-xs text-slate-500">AI 驱动的宠物健康管理平台</span></span>
          </a>
          <nav aria-label="主要导航" className="flex gap-1 text-sm">
            <a className="nav-link" href="#my-pets">我的宠物</a>
            <a className="nav-link" href="#health-analysis">健康分析</a>
            <a className="nav-link" href="#ai-assistant">AI 助手</a>
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-7xl px-5 pb-8 pt-8 sm:px-8 sm:pt-12">
        <HealthAssessmentPanel />
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-5 pb-8 text-xs text-slate-500 sm:px-8">
        <p>宠物健康平台 MVP · 用记录，让关心更有依据</p>
        <VisitTracker />
      </footer>
    </div>
  );
}
