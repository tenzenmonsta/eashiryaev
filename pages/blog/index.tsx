import Head from 'next/head';
import Link from 'next/link';
import Nav from '../../components/Nav';
import posts from '../../data/posts.json';

/**
 * Blog index page that lists all posts.
 */
interface Post {
  slug: string;
  title: string;
  date: string;
}

export default function BlogIndex() {
  const allPosts = posts as Post[];

  return (
    <>
      <Head>
        <title>Blog - Personal Site</title>
        <meta name="description" content="Blog posts" />
      </Head>
      <main className="container">
        <Nav />
        <h1 className="title">Blog</h1>
        <ul className="list">
          {allPosts.map((post) => (
            <li key={post.slug} className="list-item">
              <Link href={`/blog/${post.slug}`}>
                {post.title}
              </Link>
              <p style={{ margin: '0.25rem 0' }}>{post.date}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}