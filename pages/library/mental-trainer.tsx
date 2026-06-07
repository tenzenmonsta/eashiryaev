import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mode = "multiply" | "divide" | "weekday";

type MultiplyQ = { mode: "multiply"; a: number; b: number; answer: number };
type DivideQ = { mode: "divide"; a: number; b: number; answer: number };
type WeekdayQ = { mode: "weekday"; date: Date; answer: number };
type Question = MultiplyQ | DivideQ | WeekdayQ;

type AnswerLog = {
  question: Question;
  given: string;
  correct: boolean;
};

type Phase = "setup" | "running" | "finished";

const ROUND_DECIMALS = 5;
const ROUND_TOLERANCE = 0.5 / 10 ** ROUND_DECIMALS;
const DRILL_SECONDS = 60;

const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MODE_META: Record<Mode, { label: string; hint: string }> = {
  multiply: { label: "× Multiplication", hint: "1–100 × 1–100" },
  divide: {
    label: "÷ Division",
    hint: "1–100 ÷ 1–100 (answer to 5 decimals)",
  },
  weekday: { label: "📅 Weekday", hint: "name the day of a random date" },
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeMultiply(): MultiplyQ {
  const a = randInt(1, 100);
  const b = randInt(1, 100);
  return { mode: "multiply", a, b, answer: a * b };
}

function makeDivide(): DivideQ {
  const a = randInt(1, 100);
  const b = randInt(1, 100);
  return { mode: "divide", a, b, answer: a / b };
}

function makeWeekday(): WeekdayQ {
  const year = randInt(1925, 2075);
  const month = randInt(0, 11);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = randInt(1, daysInMonth);
  const date = new Date(year, month, day);
  const jsDay = date.getDay(); // 0=Sun
  const answer = (jsDay + 6) % 7; // 0=Mon
  return { mode: "weekday", date, answer };
}

function makeQuestion(modes: Mode[]): Question {
  const pick = modes[randInt(0, modes.length - 1)];
  if (pick === "multiply") return makeMultiply();
  if (pick === "divide") return makeDivide();
  return makeWeekday();
}

function formatDate(d: Date): string {
  return `${MONTHS_EN[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatPrompt(q: Question): string {
  if (q.mode === "multiply") return `${q.a} × ${q.b}`;
  if (q.mode === "divide") return `${q.a} ÷ ${q.b}`;
  return formatDate(q.date);
}

function formatAnswer(q: Question): string {
  if (q.mode === "weekday") return WEEKDAYS_LONG[q.answer];
  if (q.mode === "divide") return q.answer.toFixed(ROUND_DECIMALS);
  return String(q.answer);
}

function checkNumeric(q: MultiplyQ | DivideQ, raw: string): boolean {
  const cleaned = raw.trim().replace(",", ".");
  if (cleaned === "") return false;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return false;
  if (q.mode === "multiply") return parsed === q.answer;
  return Math.abs(parsed - q.answer) <= ROUND_TOLERANCE;
}

export default function MentalTrainer() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [selected, setSelected] = useState<Record<Mode, boolean>>({
    multiply: true,
    divide: false,
    weekday: false,
  });
  const [question, setQuestion] = useState<Question | null>(null);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<AnswerLog[]>([]);
  const [remainingMs, setRemainingMs] = useState<number>(DRILL_SECONDS * 1000);
  const endsAtRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedModes = useMemo(
    () => (Object.keys(selected) as Mode[]).filter((m) => selected[m]),
    [selected]
  );

  const canStart = selectedModes.length > 0;

  const correctCount = useMemo(
    () => log.filter((entry) => entry.correct).length,
    [log]
  );
  const totalCount = log.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const finish = useCallback(() => {
    setPhase("finished");
    setQuestion(null);
    setInput("");
    setRemainingMs(0);
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    const tick = () => {
      const left = endsAtRef.current - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        finish();
        return;
      }
      setRemainingMs(left);
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [phase, finish]);

  useEffect(() => {
    if (phase === "running" && question && question.mode !== "weekday") {
      inputRef.current?.focus();
    }
  }, [phase, question]);

  function startDrill() {
    if (!canStart) return;
    endsAtRef.current = Date.now() + DRILL_SECONDS * 1000;
    setRemainingMs(DRILL_SECONDS * 1000);
    setLog([]);
    setInput("");
    setQuestion(makeQuestion(selectedModes));
    setPhase("running");
  }

  function backToSetup() {
    setPhase("setup");
    setQuestion(null);
    setInput("");
    setLog([]);
    setRemainingMs(DRILL_SECONDS * 1000);
  }

  function recordAnswer(q: Question, given: string, correct: boolean) {
    setLog((prev) => [...prev, { question: q, given, correct }]);
    if (Date.now() >= endsAtRef.current) {
      finish();
      return;
    }
    setQuestion(makeQuestion(selectedModes));
    setInput("");
  }

  function handleNumericSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "running" || !question) return;
    if (question.mode === "weekday") return;
    if (input.trim() === "") return;
    const isCorrect = checkNumeric(question, input);
    recordAnswer(question, input.trim(), isCorrect);
  }

  function handleWeekdayPick(idx: number) {
    if (phase !== "running" || !question || question.mode !== "weekday") return;
    const isCorrect = idx === question.answer;
    recordAnswer(question, WEEKDAYS_LONG[idx], isCorrect);
  }

  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");

  const numericInputAttrs =
    question?.mode === "divide"
      ? { inputMode: "decimal" as const, pattern: "-?[0-9.,]*" }
      : { inputMode: "numeric" as const, pattern: "-?[0-9]*" };

  const numericInputFilter = (raw: string) =>
    question?.mode === "divide"
      ? raw.replace(/[^0-9.,\-]/g, "")
      : raw.replace(/[^0-9-]/g, "");

  return (
    <>
      <Head>
        <title>Mental Trainer</title>
        <meta
          name="description"
          content="60-second mental math drill: multiplication, decimal division, and weekday-from-date."
        />
      </Head>

      <main className="container">
        <div style={{ marginBottom: "1.4rem" }}>
          <Link href="/library" style={{ color: "#bdbdbd" }}>
            ← Back to Library
          </Link>
        </div>

        <h1 style={{ marginBottom: "0.6rem" }}>Mental Trainer</h1>

        <div className="surfaceCard" style={{ marginTop: "1.5rem" }}>
          {phase === "setup" && (
            <>
              <p style={{ color: "#d7d7d7", lineHeight: 1.6, marginTop: 0 }}>
                Pick what to practice and start. You have <strong>60 seconds</strong> to
                solve as many questions as possible.
              </p>

              <div className="trainerOptionList">
                {(Object.keys(MODE_META) as Mode[]).map((m) => {
                  const isOn = selected[m];
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={isOn}
                      className={`trainerOption ${isOn ? "trainerOptionOn" : ""}`}
                      onClick={() =>
                        setSelected((prev) => ({ ...prev, [m]: !prev[m] }))
                      }
                    >
                      <span className="trainerOptionLabel">{MODE_META[m].label}</span>
                      <span className="trainerOptionHint">{MODE_META[m].hint}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="surfaceButton trainerStartButton"
                onClick={startDrill}
                disabled={!canStart}
              >
                Start 60-second drill
              </button>

              {!canStart && (
                <div className="trainerHelpText">Select at least one mode.</div>
              )}
            </>
          )}

          {phase === "running" && question && (
            <>
              <div className="trainerHeader">
                <div className="trainerTimer">
                  {mm}:{ss}
                </div>
                <div className="trainerScore">
                  Correct: <strong>{correctCount}</strong> · Answered: {totalCount}
                </div>
                <button
                  type="button"
                  className="surfaceButton surfaceButtonSecondary trainerSmallButton"
                  onClick={finish}
                >
                  Stop
                </button>
              </div>

              <div className="trainerModeTag">
                {MODE_META[question.mode].label}
              </div>

              <div className="trainerPrompt">{formatPrompt(question)}</div>

              {question.mode === "weekday" ? (
                <div className="trainerWeekdayGrid">
                  {WEEKDAYS_SHORT.map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      className="trainerWeekdayButton"
                      onClick={() => handleWeekdayPick(idx)}
                    >
                      <div className="trainerWeekdayShort">{label}</div>
                      <div className="trainerWeekdayLong">{WEEKDAYS_LONG[idx]}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleNumericSubmit} className="trainerForm">
                  <input
                    ref={inputRef}
                    type="text"
                    {...numericInputAttrs}
                    className="surfaceInput trainerInput"
                    value={input}
                    onChange={(e) => setInput(numericInputFilter(e.target.value))}
                    placeholder={
                      question.mode === "divide"
                        ? "e.g. 1.23456"
                        : "answer"
                    }
                    autoFocus
                  />
                  <button type="submit" className="surfaceButton">
                    Submit
                  </button>
                </form>
              )}

              {question.mode === "divide" && (
                <div className="trainerHelpText">
                  Accepted within 5-decimal precision (±0.000005).
                </div>
              )}
            </>
          )}

          {phase === "finished" && (
            <>
              <div className="trainerFinishedTitle">Time&apos;s up</div>

              <div className="surfaceMetaRow" style={{ marginTop: "0.6rem" }}>
                <div className="surfaceMetaChip">
                  correct: <strong>{correctCount}</strong>
                </div>
                <div className="surfaceMetaChip">
                  answered: <strong>{totalCount}</strong>
                </div>
                <div className="surfaceMetaChip">
                  accuracy: <strong>{accuracy}%</strong>
                </div>
                <div className="surfaceMetaChip">
                  modes: <strong>{selectedModes.length}</strong>
                </div>
              </div>

              <div className="trainerFinishedActions">
                <button
                  type="button"
                  className="surfaceButton"
                  onClick={startDrill}
                  disabled={!canStart}
                >
                  Run again
                </button>
                <button
                  type="button"
                  className="surfaceButton surfaceButtonSecondary"
                  onClick={backToSetup}
                >
                  Change modes
                </button>
              </div>

              {log.length > 0 && (
                <div className="trainerLogBlock">
                  <div className="trainerLogTitle">Breakdown</div>
                  <div className="trainerLogList">
                    {log.map((entry, i) => (
                      <div
                        key={i}
                        className={`trainerLogRow ${
                          entry.correct ? "trainerLogOk" : "trainerLogBad"
                        }`}
                      >
                        <span className="trainerLogPrompt">
                          {formatPrompt(entry.question)}
                        </span>
                        <span className="trainerLogGiven">
                          your: {entry.given || "—"}
                        </span>
                        {!entry.correct && (
                          <span className="trainerLogTrue">
                            correct: {formatAnswer(entry.question)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <style jsx>{`
        .trainerOptionList {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.7rem;
          margin: 1.2rem 0 1.4rem;
        }
        .trainerOption {
          background: #111217;
          color: #f2f2f2;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 14px;
          padding: 0.95rem 1rem;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          transition: border-color 120ms, background 120ms;
        }
        .trainerOption:hover {
          border-color: rgba(255, 255, 255, 0.3);
        }
        .trainerOptionOn {
          background: rgba(242, 242, 242, 0.12);
          border-color: #f2f2f2;
        }
        .trainerOptionLabel {
          font-size: 1.05rem;
          font-weight: 650;
        }
        .trainerOptionHint {
          font-size: 0.85rem;
          color: #bdbdbd;
        }
        .trainerStartButton {
          font-size: 1.05rem;
          padding: 1rem 1.4rem;
        }
        .trainerHelpText {
          color: #bdbdbd;
          font-size: 0.88rem;
          margin-top: 0.7rem;
        }
        .trainerHeader {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .trainerTimer {
          font-variant-numeric: tabular-nums;
          font-size: clamp(1.8rem, 4vw, 2.4rem);
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .trainerScore {
          color: #d7d7d7;
          font-size: 0.98rem;
        }
        .trainerSmallButton {
          padding: 0.5rem 0.9rem;
          font-size: 0.9rem;
        }
        .trainerModeTag {
          display: inline-block;
          margin: 0.4rem 0 0;
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #d7d7d7;
          font-size: 0.85rem;
        }
        .trainerPrompt {
          font-size: clamp(2.4rem, 7vw, 3.4rem);
          font-weight: 700;
          color: #f2f2f2;
          text-align: center;
          padding: 1.4rem 0 1.2rem;
          letter-spacing: 0.02em;
          font-variant-numeric: tabular-nums;
        }
        .trainerForm {
          display: flex;
          gap: 0.65rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .trainerInput {
          width: min(280px, 100%);
          font-size: 1.25rem;
          text-align: center;
          letter-spacing: 0.04em;
          font-variant-numeric: tabular-nums;
        }
        .trainerWeekdayGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 0.55rem;
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
        .trainerWeekdayButton:hover {
          border-color: rgba(255, 255, 255, 0.32);
          background: rgba(255, 255, 255, 0.04);
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
        .trainerFinishedTitle {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0.2rem 0 0.4rem;
        }
        .trainerFinishedActions {
          display: flex;
          gap: 0.6rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }
        .trainerLogBlock {
          margin-top: 1.6rem;
        }
        .trainerLogTitle {
          color: #bdbdbd;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .trainerLogList {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          max-height: 320px;
          overflow-y: auto;
          padding-right: 0.4rem;
        }
        .trainerLogRow {
          display: flex;
          gap: 0.9rem;
          flex-wrap: wrap;
          padding: 0.5rem 0.7rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.92rem;
          font-variant-numeric: tabular-nums;
        }
        .trainerLogOk {
          border-color: rgba(88, 214, 141, 0.3);
          background: rgba(88, 214, 141, 0.06);
        }
        .trainerLogBad {
          border-color: rgba(255, 120, 120, 0.3);
          background: rgba(255, 120, 120, 0.06);
        }
        .trainerLogPrompt {
          font-weight: 650;
          min-width: 160px;
        }
        .trainerLogGiven {
          color: #d7d7d7;
        }
        .trainerLogTrue {
          color: #ffd0d0;
        }
      `}</style>
    </>
  );
}
