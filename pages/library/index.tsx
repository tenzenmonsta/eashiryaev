import Head from "next/head";
import Link from "next/link";
import { libraryItems } from "../../data/library";

export default function Library() {
  return (
    <>
      <Head>
        <title>Library</title>
        <meta name="description" content="Library: papers, notes, and write-ups" />
      </Head>

      <main className="container">
        <div style={{ marginBottom: "1.4rem" }}>
          <Link href="/" style={{ color: "#bdbdbd" }}>
            ← Home
          </Link>
        </div>

        <h1 style={{ marginBottom: "1.2rem" }}>Library</h1>

        <div className="libraryList">
          {libraryItems.map((item) => {
            const isInternal = item.href.startsWith("/library/");

            const cardContent = (
              <>
                <div className="libraryLeft">
                  <div className="libraryTitle">{item.title}</div>
                  <div className="libraryMeta">{item.date}</div>
                  {item.description && (
                    <div className="libraryDesc">{item.description}</div>
                  )}

                  <div className="libraryTags">
                    {item.tags.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="libraryRight">
                  <div className="libraryBadge">{isInternal ? "PROJECT" : "PDF"}</div>
                  <div className="libraryOpen">Open →</div>
                </div>
              </>
            );

            if (isInternal) {
              return (
                <Link key={item.slug} className="libraryCard" href={item.href}>
                  {cardContent}
                </Link>
              );
            }

            return (
              <a
                key={item.slug}
                className="libraryCard"
                href={item.href}
                target="_blank"
                rel="noreferrer"
              >
                {cardContent}
              </a>
            );
          })}
        </div>
      </main>
    </>
  );
}
