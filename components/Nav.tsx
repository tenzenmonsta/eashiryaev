import Link from 'next/link';

/**
 * A simple navigation component shared across pages.
 * Update the links as needed to match your site's structure.
 */
export default function Nav() {
  return (
    <nav>
      {/* Home link */}
      <Link href="/">
        Home
      </Link>
      {/* Blog link */}
      <Link href="/blog" style={{ marginLeft: '1rem' }}>
        Blog
      </Link>
      {/* About link */}
      <Link href="/about" style={{ marginLeft: '1rem' }}>
        About
      </Link>
      {/* CV link opens the PDF in a new tab */}
      <a href="/cv.pdf" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '1rem' }}>
        CV
      </a>
    </nav>
  );
}