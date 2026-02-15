import Head from "next/head";
import PriceTrajectories from "../components/PriceTrajectories";

export default function Home() {
  return (
    <>
      <Head>
        <title>Egor Shiryaev</title>
        <meta
          name="description"
          content="Junior Quant | Data, Models & Algorithms"
        />
      </Head>

      <div className="container">
        <div className="hero">
          {/* LEFT */}
          <div>
            <h1>
              Hi! <br />
              <span style={{ whiteSpace: "nowrap" }}>I’m Egor Shiryaev</span>
            </h1>

            <p className="sub">Quant | Data, Models & Algorithms</p>

            <div className="sideMenu">
              <a href="/library">› Library</a>
              <a href="/cv.pdf" target="_blank" rel="noreferrer">
                › CV
              </a>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <PriceTrajectories
              s0={100}
              mu={0.12}
              sigma={0.35}
              steps={220}
              paths={28}
            />
          </div>
        </div>
      </div>
    </>
  );
}
