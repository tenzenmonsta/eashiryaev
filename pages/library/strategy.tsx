import Head from "next/head";
import Link from "next/link";

export default function Strategy() {
  return (
    <>
      <Head>
        <title>Strategy</title>
        <meta name="description" content="Strategy page" />
      </Head>

      <main className="container">
        <Link href="/" style={{ color: "#bdbdbd" }}>← Home</Link>
        <h1 style={{ marginTop: "1rem" }}>Strategy</h1>
        <p style={{ color: "#d7d7d7", lineHeight: 1.65 }}>
          Coming soon.
        </p>
      </main>
    </>
  );
}