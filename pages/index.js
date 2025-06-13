import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/search');
  }, [router]);

  return null;
} 