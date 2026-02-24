import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { libraryItems } from "../../data/library";

export default function LibrarySlugPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : "";

  const item = libraryItems.find((x) => x.slug === slug);

  if (!item) {
    return (
      <main className="container">
        <Link href="/library" style={{ color: "#bdbdbd" }}>
          ← Back to Library
        </Link>
        <h1 style={{ marginTop: "1rem" }}>Not found</h1>
      </main>
    );
  }

  const isStrategy = item.slug === "strategy-overview";

  return (
    <>
      <Head>
        <title>{item.title}</title>
        <meta name="description" content={item.description} />
      </Head>

      <main className="container">
        <div style={{ marginBottom: "1.4rem" }}>
          <Link href="/library" style={{ color: "#bdbdbd" }}>
            ← Back to Library
          </Link>
        </div>

        <h1 style={{ marginBottom: "0.6rem" }}>{item.title}</h1>
        <div style={{ color: "#bdbdbd", marginBottom: "1.1rem" }}>{item.date}</div>

        <p style={{ color: "#d7d7d7", lineHeight: 1.65, maxWidth: 900 }}>
          {item.description}
        </p>

        {isStrategy && (
          <div style={{ marginTop: "1.4rem", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a
              href="/quant_end-to_end.pdf"
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
              Open PDF →
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
              Download .ipynb →
            </a>
          </div>
        )}
      </main>
    </>
  );
}