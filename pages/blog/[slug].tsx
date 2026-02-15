import { useRouter } from 'next/router';
import Head from 'next/head';
import Nav from '../../components/Nav';
import postsData from '../../data/posts.json';

interface Post {
  slug: string;
  title: string;
  date: string;
  content: string;
}

/**
 * Dynamic blog post page. It looks up the post by slug from posts.json.
 */
export default function BlogPost() {
  const router = useRouter();
  const { slug } = router.query;
  const posts = postsData as Post[];
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <main className="container">
        <Nav />
        <p>Post not found.</p>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{post.title} - Blog</title>
      </Head>
      <main className="container">
        <Nav />
        <h1 className="title">{post.title}</h1>
        <p style={{ margin: '0.25rem 0' }}>{post.date}</p>
        {/* eslint-disable-next-line react/no-danger */}
        <div
          dangerouslySetInnerHTML={{ __html: post.content }}
          style={{ marginTop: '1rem' }}
        />
      </main>
    </>
  );
}