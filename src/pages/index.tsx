import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { Document } from '@prismicio/client/types/documents';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

// import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

function formatDate(value: Date): string {
  return format(value, 'dd MMM yyyy', { locale: ptBR });
}

function formatPost(post: Document): Post {
  return {
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  };
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState('');

  useEffect(() => {
    setPosts(postsPagination.results);
    setNextPage(postsPagination.next_page);
  }, [postsPagination]);

  async function loadMore(): Promise<void> {
    const response = await fetch(nextPage);
    const body = await response.json();

    const morePosts = body.results.map(formatPost);

    setNextPage(body.next_page);
    setPosts([...posts, ...morePosts]);
  }

  return (
    <>
      <Head>
        <title>Início | spacetraveling</title>
      </Head>
      <main className={styles.container}>
        <section className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <span>
                  <FiCalendar />
                  <time>
                    {formatDate(new Date(post.first_publication_date))}
                  </time>
                </span>
                <span>
                  <FiUser />
                  <span>{post.data.author}</span>
                </span>
              </a>
            </Link>
          ))}
        </section>
        {!!nextPage && (
          <button type="button" onClick={loadMore}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { pageSize: 1 }
  );

  const posts = response.results.map(formatPost);

  return {
    props: {
      postsPagination: {
        next_page: response.next_page,
        results: posts,
      },
    },
  };
};
