import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>AggieRoomie - Texas A&M Dorm Finder</title>
        <meta name="description" content="Find and compare Texas A&M University dorms" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span className={styles.highlight}>AggieRoomie</span>
        </h1>

        <p className={styles.description}>
          Find your perfect dorm at Texas A&M University
        </p>

        <div className={styles.grid}>
          <Link href="/map" className={styles.card}>
            <h2>Campus Map &rarr;</h2>
            <p>View all dorms on an interactive campus map.</p>
          </Link>

          <Link href="/dorms" className={styles.card}>
            <h2>Dorm List &rarr;</h2>
            <p>Browse and compare all available dorms.</p>
          </Link>

          <Link href="/search" className={styles.card}>
            <h2>Search &rarr;</h2>
            <p>Find dorms based on your preferences.</p>
          </Link>

          <Link href="/compare" className={styles.card}>
            <h2>Compare &rarr;</h2>
            <p>Compare different dorms side by side.</p>
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Made with ❤️ for Aggies</p>
      </footer>
    </div>
  )
} 