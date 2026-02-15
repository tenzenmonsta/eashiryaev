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
      "Короткая заметка: портфель с хеджированием, лемма Ито, устранение стохастической части и получение PDE Блэка–Шоулза.",
    href: "/Black_Scholes_Merton.pdf"


  },
];
