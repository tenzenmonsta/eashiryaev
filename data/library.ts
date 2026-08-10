export type Lang = "en" | "ru";

export type Localized<T> = { en: T; ru: T };

export type LibraryItem = {
  slug: string;
  title: Localized<string>;
  date: string;
  tags: Localized<string[]>;
  description: Localized<string>;
  href: Localized<string>;
};

export const libraryItems: LibraryItem[] = [
  {
    slug: "bsm-derivation",
    title: {
      en: "Black–Scholes Derivation",
      ru: "Вывод уравнения Блэка–Шоулза",
    },
    date: "2026-01-29",
    tags: {
      en: ["quant", "derivatives", "stochastic calculus"],
      ru: ["квант", "деривативы", "стохастическое исчисление"],
    },
    description: {
      en: "A hedged portfolio, Itô's lemma, eliminating the stochastic term, and deriving the Black–Scholes PDE.",
      ru: "Портфель с хеджированием, лемма Ито, устранение стохастической части и получение PDE Блэка–Шоулза.",
    },
    href: {
      en: "/Black_Scholes_Merton-en.pdf",
      ru: "/Black_Scholes_Merton.pdf",
    },
  },
  {
    slug: "strategy-overview",
    title: {
      en: "Strategy Overview",
      ru: "Обзор стратегии",
    },
    date: "2026-02-24",
    tags: {
      en: ["quant", "strategy", "research"],
      ru: ["квант", "стратегия", "исследование"],
    },
    description: {
      en: "A concise strategy overview: data → signal → cross-validation → backtest → metrics. PDF + Jupyter notebook.",
      ru: "Краткий обзор стратегии: данные → сигнал → cross-validation → бэктест → метрики. PDF + Jupyter notebook.",
    },
    href: {
      en: "/quant_end-to_end-en.pdf",
      ru: "/quant_end-to_end.pdf",
    },
  },
  {
    slug: "volatility-surface",
    title: {
      en: "Volatility Surface Builder",
      ru: "Volatility Surface Builder",
    },
    date: "2026-03-23",
    tags: {
      en: ["quant", "options", "volatility", "plotly"],
      ru: ["квант", "опционы", "волатильность", "plotly"],
    },
    description: {
      en: "Builds a cleaned implied volatility surface from option chain data, recovers forward prices via put-call parity, and visualizes the forward-normalized surface interactively.",
      ru: "Строит очищенную поверхность подразумеваемой волатильности по данным опционных цепочек, восстанавливает форвардные цены через put-call parity и визуализирует нормализованную по форварду поверхность в интерактивном режиме.",
    },
    href: {
      en: "/library/volatility-surface",
      ru: "/library/volatility-surface",
    },
  },
  {
    slug: "mental-trainer",
    title: {
      en: "Mental Trainer",
      ru: "Mental Trainer",
    },
    date: "2026-06-06",
    tags: {
      en: ["trainer", "mental math", "interactive"],
      ru: ["тренажёр", "устный счёт", "интерактив"],
    },
    description: { en: "", ru: "" },
    href: {
      en: "/library/mental-trainer",
      ru: "/library/mental-trainer",
    },
  },
];
