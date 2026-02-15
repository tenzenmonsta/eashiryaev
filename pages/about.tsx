import Head from 'next/head';
import Nav from '../components/Nav';

/**
 * About page describing yourself. Update the content to suit your own bio,
 * bullet points and social links.
 */
export default function About() {
  return (
    <>
      <Head>
        <title>About - Personal Site</title>
        <meta name="description" content="About me" />
      </Head>
      <main className="container">
        <Nav />
        <h1 className="title">About Me</h1>
        <p>
          This is a short bio section. Replace this text with your own description,
          explaining who you are, what you do and what you're passionate about.
        </p>
        <ul className="list">
          <li className="list-item">• Full-stack developer from Warsaw</li>
          <li className="list-item">• Building web apps with modern technologies</li>
          <li className="list-item">• Passionate about open source and design</li>
        </ul>
        <div style={{ marginTop: '1rem' }}>
          {/* Social links */}
          <a
            href="mailto:your@example.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginRight: '1rem' }}
          >
            Email
          </a>
          <a
            href="https://github.com/yourusername"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginRight: '1rem' }}
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/yourusername"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </main>
    </>
  );
}