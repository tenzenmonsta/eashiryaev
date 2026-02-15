import '../styles/globals.css';
import type { AppProps } from 'next/app';

/**
 * Custom App component to initialize pages. It includes global styles.
 * See https://nextjs.org/docs/basic-features/pages#custom-app for more details.
 */
export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}