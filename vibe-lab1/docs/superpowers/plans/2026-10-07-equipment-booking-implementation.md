# 教务器材预约页面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个无需后端、直接打开 `index.html` 即可运行的三器材本地预约演示页面。

**Architecture:** 将预约规则放在独立的 `booking.js` 纯逻辑模块中，使用 UMD 兼容浏览器全局对象和 Node `require`，使核心逻辑不依赖 DOM。`app.js` 只负责器材卡片渲染、表单交互和 `localStorage` 适配；`index.html` 和 `styles.css` 提供页面结构与视觉样式。

**Tech Stack:** 原生 HTML、CSS、JavaScript；Node.js 内置 `node:test`；无第三方依赖、框架、构建工具或后端。

**Spec:** `docs/superpowers/specs/2026-10-07-equipment-booking-design.md`

## Global Constraints

- 页面必须展示三张器材卡片，每张包含名称、简介和“预约”按钮。
- 同一器材、同一天、同一时间段只能预约一次。
- 冲突预约必须被拒绝，并给出清晰的中文提示。
- 打开 `index.html` 即可运行，不依赖后端、数据库或构建工具。
- 预约记录使用浏览器 `localStorage` 的 `equipmentBookings` 键保存。
- 不添加运行时或测试第三方依赖。

## Review Focus

- 恶意或损坏的 `localStorage` JSON 不应阻止页面加载；测试 `readBookings` 返回空记录。
- 缺少器材、日期或时间段时不应创建预约；测试 `createBooking` 返回参数错误结果。
- 同一器材的同一日期时段重复预约必须被拒绝；测试结果和记录数量不变。
- 不同器材或不同日期/时段的预约必须互不冲突；测试均可成功创建。
- 用户提交冲突后表单应保留并显示明确提示；手动验收覆盖 UI 状态。

### Task 1: 建立核心预约规则模块与测试

**Files:**
- Create: `booking.js`
- Create: `tests/booking.test.js`
- Create: `package.json`

**Interfaces:**
- Produces `readBookings(rawValue) -> Booking[]`, `isSlotBooked(bookings, equipmentId, date, timeSlot) -> boolean`, and `createBooking(bookings, input) -> { ok: boolean, bookings: Booking[], message: string }`.
- `Booking` 结构固定为 `{ equipmentId: string, date: string, timeSlot: string }`。
- `createBooking` 不修改传入数组；成功时返回新数组，冲突或参数无效时返回原预约内容的等价副本。
- `booking.js` 在浏览器中暴露 `window.EquipmentBooking`，在 Node 中通过 `module.exports` 暴露同一组函数。

- [x] **Step 1: Write the failing tests**

  在 `tests/booking.test.js` 中使用 `node:test` 和 `node:assert/strict`，先写以下测试：

  - `readBookings returns an empty list for malformed JSON`：传入损坏 JSON，断言返回 `[]`。
  - `createBooking accepts a new valid booking`：传入空数组和完整输入，断言 `ok === true`、返回消息为成功提示且新数组包含一条记录。
  - `createBooking rejects the same equipment date and slot`：先创建一条记录，再用相同三元组提交，断言 `ok === false`、消息包含“已被预约”、返回数组长度仍为 1。
  - `createBooking allows a different equipment on the same slot`：不同 `equipmentId` 应成功。
  - `createBooking allows a different date or slot`：相同器材但日期不同、时间段不同都应成功。
  - `createBooking rejects missing booking fields`：缺少字段或空字符串时断言 `ok === false`，且不会写入记录。

- [x] **Step 2: Run the tests and verify the expected RED state**

  Run: `node --test tests/booking.test.js`

  Expected: FAIL because `booking.js` and its exported functions do not yet exist; fix only test import or syntax errors if present, and do not add production implementation before the feature-missing failure is observed.

- [x] **Step 3: Implement the minimal pure functions in `booking.js`**

  实现 JSON 解析与记录过滤、三字段严格匹配的冲突判断、参数校验和不可变追加。消息统一使用中文，例如成功返回“预约成功”，冲突返回“该器材在所选日期和时间段已被预约，请选择其他时间。”，参数错误返回“请选择完整的器材、日期和时间段。”。

- [x] **Step 4: Run the focused tests and verify GREEN**

  Run: `node --test tests/booking.test.js`

  Expected: all tests pass with zero failures.

- [x] **Step 5: Add the project test script**

  在 `package.json` 中仅添加名称、私有项目标记和 `scripts.test: "node --test tests/booking.test.js"`，不添加依赖。

### Task 2: 创建页面结构与视觉样式

**Files:**
- Create: `index.html`
- Create: `styles.css`

**Interfaces:**
- `index.html` 提供 `#equipment-list`、`#booking-dialog`、`#booking-form`、`#equipment-id`、`#booking-date`、`#time-slot`、`#booking-message` 和关闭按钮等稳定选择器。
- 页面通过 `<script src="booking.js"></script>` 后再加载 `<script src="app.js"></script>`，保证 UI 层可使用核心模块。

- [x] **Step 1: 写出可供 UI 层使用的 HTML 骨架**

  创建语义化页头、主内容区、器材列表、预约弹窗/对话框和无障碍标签。日期输入使用 `type="date"`，时间段使用固定下拉选项，表单提交按钮文字为“确认预约”，关闭按钮文字为“取消”。

- [x] **Step 2: 添加简洁响应式样式**

  在 `styles.css` 中实现浅色背景、清晰卡片层级、统一圆角和按钮状态；宽屏使用三列卡片，窄屏降为单列；成功、错误提示使用不同颜色但保持足够对比度。不要引入字体、图标或 CSS 框架。

### Task 3: 实现浏览器 UI 与本地存储适配

**Files:**
- Create: `app.js`

**Interfaces:**
- 消费 `window.EquipmentBooking` 的三个核心函数和 `window.localStorage`。
- 内置恰好三项器材数据，每项包含 `id`、`name`、`description`、`icon` 或等价展示字段。
- 仅 UI 层读写 `equipmentBookings`：读取时调用 `readBookings(localStorage.getItem('equipmentBookings'))`，成功后 JSON 序列化写回。

- [x] **Step 1: 编写 UI 验收所需的最小渲染与交互代码**

  页面加载时渲染三张卡片；点击“预约”写入当前器材并打开对话框；关闭按钮关闭对话框并清空提示；提交表单时调用 `createBooking`，成功则保存记录，并在页面明显位置显示成功提示；冲突时保留弹窗和表单内容，同时显示明确的中文错误提示。

- [x] **Step 2: 设置日期边界和表单反馈**

  将日期输入的 `min` 设置为当天日期，提交前依赖浏览器 `required` 校验并再次把字段交给核心逻辑；提示区域使用 `role="status"` 或 `role="alert"`，使成功和拒绝信息可被辅助技术读取。

- [ ] **Step 3: 在浏览器中手动检查本地持久化**

  直接打开 `index.html`，完成一次预约后刷新页面，再用相同器材、日期和时段提交；确认仍显示拒绝提示。使用浏览器开发者工具确认只存在 `equipmentBookings` 本地键。

### Task 4: 全量验证与交付检查

**Files:**
- Modify: none unless verification finds a defect.

- [x] **Step 1: Run the complete automated test command**

  Run: `npm test`

  Expected: Node 内置测试全部通过，退出码为 0，无第三方依赖安装步骤。

- [ ] **Step 2: Perform the manual acceptance checklist**

  在浏览器中逐项确认：

  1. 页面首次加载显示恰好三张器材卡片，名称、简介和“预约”按钮均可见。
  2. 点击每张卡片的“预约”都打开表单，并显示正确器材名称或标识。
  3. 未完整选择日期/时间段时不能完成有效预约。
  4. 首次提交成功并显示成功提示。
  5. 使用相同器材、日期、时间段再次提交时明确拒绝。
  6. 更换器材、日期或时间段后可以成功预约。
  7. 刷新页面后已保存预约仍参与冲突判断。
  8. 关闭弹窗和窄屏宽度下页面布局正常。

- [x] **Step 3: Inspect the final file list and report it**

  确认交付包含 `index.html`、`styles.css`、`booking.js`、`app.js`、`tests/booking.test.js`、`package.json` 和设计/计划文档，并在最终回复中说明每个文件职责、核心预约逻辑位置及运行测试命令。
