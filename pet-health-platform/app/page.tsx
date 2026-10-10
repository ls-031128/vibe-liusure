export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Day 2 · T2</p>
        <h1 id="page-title">宠物健康平台 MVP</h1>
        <p className="description">
          面向普通宠物主人的健康信息辅助工具，帮助整理宠物异常信息，并提供初步风险提示、观察建议和就医提醒。
        </p>
        <p className="status" role="status">
          当前处于开发阶段，健康评估表单和 AI 调用尚未实现。
        </p>
      </section>
    </main>
  );
}
