export type LibraryItem = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
  href: string;
};

export const libraryItems: LibraryItem[] = [
  {
    slug: "bsm-derivation",
    title: "Вывод уравнения Блэка–Шоулза",
    date: "2026-01-29",
    tags: ["quant", "derivatives", "stochastic calculus"],
    description:
      "Портфель с хеджированием, лемма Ито, устранение стохастической части и получение PDE Блэка–Шоулза.",
    href: "/Black_Scholes_Merton.pdf",
  },
  {
    slug: "strategy-overview",
    title: "Обзор стратегии",
    date: "2026-02-24",
    tags: ["quant", "strategy", "research"],
    description:
      "Краткий обзор стратегии: данные → сигнал → cross-validation → бэктест → метрики. PDF + Jupyter notebook.",
    href: "/quant_end-to_end.pdf",
  },
];
