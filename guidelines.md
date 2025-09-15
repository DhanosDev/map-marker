# 🧭 Angular 18+ Technical Guidelines

> 📌 These guidelines define the architectural, technical, and quality standards for this project.  
> The goal is to follow **modern Angular practices** and **enterprise-grade code quality** throughout development.

---

## 🛠️ CORE PRINCIPLES

- ✅ Angular 18+ only – no legacy NgModules
- ✅ Standalone Components everywhere
- ✅ Signals API for state & reactivity
- ✅ Clean Architecture principles
- ✅ Focus on simplicity, clarity, and maintainability

---

## 📦 PROJECT STRUCTURE

src/app/
├── core/ # Singleton services, guards, interceptors
├── shared/ # Reusable components, directives, pipes
├── features/ # Feature areas (e.g., location-map)
│ └── \*.page.ts # Route components
│ └── components/
├── app.routes.ts # Standalone routing config
└── app.component.ts

---

## 🧩 COMPONENT ARCHITECTURE

- 🧠 **Smart Components** → Handle logic & data-fetching
- 🎨 **Dumb Components** → UI-only, @Input/@Output or Signals
- ♻️ **Reusable Components** → Placed under `/shared/components`
- 📦 **OnPush Strategy** → Used only when justified (RxJS hybrid)

---

## ⚛️ STATE MANAGEMENT

- Signals API (`signal`, `computed`, `effect`) for reactivity
- `toSignal()` only where it provides actual benefit
- Avoid overengineering: no external state libraries unless justified

---

## 🧪 TESTING & QUALITY

- ✅ Jest for unit testing
- ✅ Angular Testing Utilities + Testing Library
- ✅ ESLint + Prettier for consistency
- ✅ Minimum 80% coverage on core/feature logic
- ✅ Strict TypeScript mode

---

## 🧱 UI/UX & STYLING

- 🎨 Tailwind-first styling strategy
- 📱 Mobile-first layout, responsive breakpoints
- ♿ Accessibility: ARIA, keyboard nav, semantic roles
- 🎯 Focused on usability, performance & progressive enhancement

---

## ⚡ PERFORMANCE STRATEGIES

- Lazy load routes via `loadComponent`
- Use `@defer` for heavy components
- `trackBy` in all `*ngFor` usage
- Avoid unnecessary subscriptions or memory leaks

---

## 🚀 DEPLOYMENT TARGET

- Modern browser support (ES2022+)
- Optimized builds with Angular CLI
- Optional: PWA support, SSR readiness (if needed)

---
