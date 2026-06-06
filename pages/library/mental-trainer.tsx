import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Mode = "multiply" | "divide" | "weekday";

type Question =
  | { mode: "multiply"; a: number; b: number; answer: number }
  | { mode: "divide"; dividend: number; divisor: number; answer: number }
  | { mode: "weekday"; date: Date; answer: number };

type Verdict = "idle" | "correct" | "wrong";

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEKDAYS_RU_FULL = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];
const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeMultiply(): Question {
  const a = randInt(1, 100);
  const b = randInt(1, 100);
  return { mode: "multiply", a, b, answer: a * b };
}

function makeDivide(): Question {
  // Pick divisor and integer quotient so dividend is in [1, 1000] and result is integer.
  const divisor = randInt(2, 100);
  const maxQuotient = Math.max(1, Math.floor(1000 / divisor));
  const quotient = randInt(1, Math.min(100, maxQuotient));
  const dividend = divisor * quotient;
  return { mode: "divide", dividend, divisor, answer: quotient };
}

function makeWeekday(): Question {
  // Random date in [1925, 2075]. JS Date.getDay(): 0=Sun, 1=Mon ... 6=Sat.
  // We use 0=Mon ... 6=Sun internally to match WEEKDAYS_RU order.
  const year = randInt(1925, 2075);
  const month = randInt(0, 11);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = randInt(1, daysInMonth);
  const date = new Date(year, month, day);
  const jsDay = date.getDay(); // 0=Sun
  const answer = (jsDay + 6) % 7; // 0=Mon
  return { mode: "weekday", date, answer };
}

function makeQuestion(mode: Mode): Question {
  if (mode === "multiply") return makeMultiply();
  if (mode === "divide") return makeDivide();
  return makeWeekday();
}

function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
}

export default function MentalTrainer() {
  const [mode, setMode] = useState<Mode>("multiply");
  const [question, setQuestion] = useState<Question>(() => makeQuestion("multiply"));
  const [input, setInput] = useState("");
  const [verdict, setVerdict] = useState<Verdict>("idle");
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  useEffect(() => {
    setQuestion(makeQuestion(mode));
    setInput("");
    setVerdict("idle");
    setElapsedMs(null);
    setStartedAt(Date.now());
  }, [mode]);

  useEffect(() => {
    if (verdict === "idle" && mode !== "weekday") {
      inputRef.current?.focus();
    }
  }, [verdict, mode, question]);

  function next() {
    setQuestion(makeQuestion(mode));
    setInput("");
    setVerdict("idle");
    setElapsedMs(null);
    setStartedAt(Date.now());
  }

  function commit(value: number) {
    if (verdict !== "idle") {
      return;
    }
    const isCorrect = value === question.answer;
    setVerdict(isCorrect ? "correct" : "wrong");
    setTotal((t) => t + 1);
    setElapsedMs(Date.now() - startedAt);
    if (isCorrect) {
      setCorrect((c) => c + 1);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => (ns > b ? ns : b));
        return ns;
      });
    } else {
      setStreak(0);
    }
  }

  function handleNumericSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (verdict !== "idle") {
      next();
      return;
    }
    if (input.trim() === "") {
      return;
    }
    const parsed = Number(input.trim());
    if (!Number.isFinite(parsed)) {
      return;
    }
    commit(parsed);
  }

  function resetStats() {
    setCorrect(0);
    setTotal(0);
    setStreak(0);
    setBestStreak(0);
    next();
  }

  const prompt = useMemo(() => {
    if (question.mode === "multiply") {
      return `${question.a} × ${question.b}`;
    }
    if (question.mode === "divide") {
      return `${question.dividend} ÷ ${question.divisor}`;
    }
    return formatDate(question.date);
  }, [question]);

  const correctAnswerLabel = useMemo(() => {
    if (question.mode === "weekday") {
      return WEEKDAYS_RU_FULL[question.answer];
    }
    return String(question.answer);
  }, [question]);

  return (
    <>
      <Head>
        <title>Mental Trainer</title>
        <meta
          name="description"
          content="Тренажёр устного счёта: умножение, деление и определение дня недели по дате."
        />
      </Head>

      <main className="container">
        <div style={{ marginBottom: "1.4rem" }}>
          <Link href="/library" style={{ color: "#bdbdbd" }}>
            ← Back to Library
          </Link>
        </div>

        <h1 style={{ marginBottom: "0.6rem" }}>Mental Trainer</h1>
        <p style={{ color: "#d7d7d7", lineHeight: 1.65, maxWidth: 760 }}>
          Три режима: умножение (1–100), деление с целым результатом (делимое до 1000)
          и определение дня недели по дате. Жми <kbd>Enter</kbd>, чтобы ответить и перейти
          к следующему вопросу.
        </p>

        <div className="surfaceCard" style={{ marginTop: "1.5rem" }}>
          <div className="trainerTabs" role="tablist">
            {([
              ["multiply", "× Умножение"],
              ["divide", "÷ Деление"],
              ["weekday", "📅 День недели"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                className={`trainerTab ${mode === key ? "trainerTabActive" : ""}`}
                onClick={() => setMode(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="surfaceMetaRow" style={{ marginTop: "1.2rem" }}>
            <div className="surfaceMetaChip">верно: <strong>{correct}</strong> / {total}</div>
            <div className="surfaceMetaChip">точность: <strong>{accuracy}%</strong></div>
            <div className="surfaceMetaChip">серия: <strong>{streak}</strong></div>
            <div className="surfaceMetaChip">рекорд: <strong>{bestStreak}</strong></div>
            <button
              type="button"
              className="surfaceButton surfaceButtonSecondary"
              onClick={resetStats}
              style={{ padding: "0.45rem 0.85rem", fontSize: "0.9rem" }}
            >
              Сбросить
            </button>
          </div>

          <div className="trainerPrompt">{prompt}</div>

          {question.mode === "weekday" ? (
            <div className="trainerWeekdayGrid">
              {WEEKDAYS_RU.map((label, idx) => {
                const isAnswer = idx === question.answer;
                const isPicked = verdict !== "idle" && input === String(idx);
                const cls = [
                  "trainerWeekdayButton",
                  verdict !== "idle" && isAnswer ? "trainerWeekdayCorrect" : "",
                  verdict === "wrong" && isPicked && !isAnswer ? "trainerWeekdayWrong" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    key={label}
                    type="button"
                    className={cls}
                    disabled={verdict !== "idle"}
                    onClick={() => {
                      setInput(String(idx));
                      commit(idx);
                    }}
                  >
                    <div className="trainerWeekdayShort">{label}</div>
                    <div className="trainerWeekdayLong">{WEEKDAYS_RU_FULL[idx]}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleNumericSubmit} className="trainerForm">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="-?[0-9]*"
                className="surfaceInput trainerInput"
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/[^0-9-]/g, ""))}
                placeholder="ответ"
                autoFocus
                disabled={verdict !== "idle"}
              />
              <button type="submit" className="surfaceButton">
                {verdict === "idle" ? "Ответить" : "Дальше"}
              </button>
            </form>
          )}

          {verdict !== "idle" && (
            <div
              className={`trainerVerdict ${
                verdict === "correct" ? "trainerVerdictOk" : "trainerVerdictBad"
              }`}
            >
              {verdict === "correct" ? (
                <>
                  Верно{elapsedMs !== null ? ` · ${(elapsedMs / 1000).toFixed(1)} c` : ""}.{" "}
                  <button type="button" onClick={next} className="trainerLinkButton">
                    Следующий →
                  </button>
                </>
              ) : (
                <>
                  Ответ: <strong>{correctAnswerLabel}</strong>.{" "}
                  <button type="button" onClick={next} className="trainerLinkButton">
                    Следующий →
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .trainerTabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .trainerTab {
          background: transparent;
          color: #d7d7d7;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          padding: 0.6rem 0.95rem;
          font-size: 0.98rem;
          cursor: pointer;
        }
        .trainerTab:hover {
          border-color: rgba(255, 255, 255, 0.28);
        }
        .trainerTabActive {
          background: #f2f2f2;
          color: #111217;
          border-color: #f2f2f2;
          font-weight: 650;
        }
        .trainerPrompt {
          font-size: clamp(2.4rem, 7vw, 3.4rem);
          font-weight: 700;
          color: #f2f2f2;
          text-align: center;
          padding: 1.6rem 0;
          letter-spacing: 0.02em;
        }
        .trainerForm {
          display: flex;
          gap: 0.65rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .trainerInput {
          width: min(240px, 100%);
          font-size: 1.25rem;
          text-align: center;
          letter-spacing: 0.05em;
        }
        .trainerWeekdayGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 0.6rem;
        }
        .trainerWeekdayButton {
          background: #111217;
          color: #f2f2f2;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          padding: 0.85rem 0.5rem;
          cursor: pointer;
          text-align: center;
          transition: border-color 120ms, background 120ms;
        }
        .trainerWeekdayButton:hover:not(:disabled) {
          border-color: rgba(255, 255, 255, 0.32);
        }
        .trainerWeekdayButton:disabled {
          cursor: default;
        }
        .trainerWeekdayShort {
          font-size: 1.1rem;
          font-weight: 650;
        }
        .trainerWeekdayLong {
          font-size: 0.78rem;
          color: #bdbdbd;
          margin-top: 0.15rem;
        }
        .trainerWeekdayCorrect {
          background: rgba(88, 214, 141, 0.16);
          border-color: rgba(88, 214, 141, 0.55);
        }
        .trainerWeekdayWrong {
          background: rgba(255, 120, 120, 0.14);
          border-color: rgba(255, 120, 120, 0.5);
        }
        .trainerVerdict {
          margin-top: 1rem;
          border-radius: 12px;
          padding: 0.9rem 1rem;
          font-size: 1rem;
        }
        .trainerVerdictOk {
          color: #b9f0c8;
          border: 1px solid rgba(88, 214, 141, 0.35);
          background: rgba(88, 214, 141, 0.08);
        }
        .trainerVerdictBad {
          color: #ffd0d0;
          border: 1px solid rgba(255, 120, 120, 0.32);
          background: rgba(255, 120, 120, 0.08);
        }
        .trainerLinkButton {
          background: transparent;
          border: none;
          color: inherit;
          font: inherit;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
          margin-left: 0.35rem;
        }
        kbd {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-bottom-width: 2px;
          border-radius: 6px;
          padding: 0.05rem 0.4rem;
          font-size: 0.85em;
        }
      `}</style>
    </>
  );
}
