import Head from "next/head";
import Link from "next/link";
import { libraryItems } from "../../data/library";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const UI = {
  en: {
    pageTitle: "Library",
    description: "Library: papers, notes, and write-ups",
    home: "← Home",
    project: "PROJECT",
    pdf: "PDF",
    open: "Open →",
  },
  ru: {
    pageTitle: "Библиотека",
    description: "Библиотека: статьи, заметки и обзоры",
    home: "← Домой",
    project: "ПРОЕКТ",
    pdf: "PDF",
    open: "Открыть →",
  },
};

export default function Library() {
  const { lang } = useLanguage();
  const t = UI[lang];

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.description} />
      </Head>

      <main className="container">
        <div style={{ marginBottom: "1.4rem" }}>
          <Link href="/" style={{ color: "#bdbdbd" }}>
            {t.home}
          </Link>
        </div>

        <h1 style={{ marginBottom: "1.2rem" }}>{t.pageTitle}</h1>

        <div className="libraryList">
          {libraryItems.map((item) => {
            const href = item.href[lang];
            const isInternal = href.startsWith("/library/");

            const cardContent = (
              <>
                <div className="libraryLeft">
                  <div className="libraryTitle">{item.title[lang]}</div>
                  <div className="libraryMeta">{item.date}</div>
                  {item.description[lang] && (
                    <div className="libraryDesc">{item.description[lang]}</div>
                  )}

                  <div className="libraryTags">
                    {item.tags[lang].map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="libraryRight">
                  <div className="libraryBadge">{isInternal ? t.project : t.pdf}</div>
                  <div className="libraryOpen">{t.open}</div>
                </div>
              </>
            );

            if (isInternal) {
              return (
                <Link key={item.slug} className="libraryCard" href={href}>
                  {cardContent}
                </Link>
              );
            }

            return (
              <a
                key={item.slug}
                className="libraryCard"
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                {cardContent}
              </a>
            );
          })}
        </div>
      </main>

      <LanguageSwitcher />
    </>
  );
}
