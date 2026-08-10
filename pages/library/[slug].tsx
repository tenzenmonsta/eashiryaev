import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { libraryItems } from "../../data/library";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const UI = {
  en: {
    back: "← Back to Library",
    notFound: "Not found",
    openPdf: "Open PDF →",
    downloadIpynb: "Download .ipynb →",
  },
  ru: {
    back: "← Назад в библиотеку",
    notFound: "Не найдено",
    openPdf: "Открыть PDF →",
    downloadIpynb: "Скачать .ipynb →",
  },
};

export default function LibrarySlugPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = UI[lang];
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";

  const item = libraryItems.find((x) => x.slug === slug);

  if (!item) {
    return (
      <>
        <main className="container">
          <Link href="/library" style={{ color: "#bdbdbd" }}>
            {t.back}
          </Link>
          <h1 style={{ marginTop: "1rem" }}>{t.notFound}</h1>
        </main>
        <LanguageSwitcher />
      </>
    );
  }

  const isStrategy = item.slug === "strategy-overview";

  return (
    <>
      <Head>
        <title>{item.title[lang]}</title>
        <meta name="description" content={item.description[lang]} />
      </Head>

      <main className="container">
        <div style={{ marginBottom: "1.4rem" }}>
          <Link href="/library" style={{ color: "#bdbdbd" }}>
            {t.back}
          </Link>
        </div>

        <h1 style={{ marginBottom: "0.6rem" }}>{item.title[lang]}</h1>
        <div style={{ color: "#bdbdbd", marginBottom: "1.1rem" }}>{item.date}</div>

        <p style={{ color: "#d7d7d7", lineHeight: 1.65, maxWidth: 900 }}>
          {item.description[lang]}
        </p>

        {isStrategy && (
          <div style={{ marginTop: "1.4rem", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a
              href={item.href[lang]}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "10px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              {t.openPdf}
            </a>

            <a
              href="/Quant_end-to-end.ipynb"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "11px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              {t.downloadIpynb}
            </a>
          </div>
        )}
      </main>

      <LanguageSwitcher />
    </>
  );
}
