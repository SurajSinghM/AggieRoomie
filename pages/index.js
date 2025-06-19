import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <Head>
        <title>AggieRoomie - Your Perfect Dorm Finder</title>
        <meta name="description" content="Find your perfect dorm at Texas A&M University with our comprehensive search and comparison tools" />
      </Head>

      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <span className={styles.logoText}>AggieRoomie</span>
          </div>
          <div className={styles.navActions}>
            <a 
              href="https://github.com/SurajSinghM/AggieRoomie" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.githubButton}
              aria-label="View on GitHub"
            >
              <svg className={styles.githubIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Find Your Perfect
              <span className={styles.highlight}> Dorm</span>
            </h1>
            <p className={styles.heroDescription}>
              Discover the ideal living space at Texas A&M University with our comprehensive dorm search, 
              comparison tools, and interactive campus map.
            </p>
            <div className={styles.heroActions}>
              <Link href="/search" className="btn btn-primary btn-lg">
                Start Searching
              </Link>
              <Link href="/map" className="btn btn-secondary btn-lg">
                Explore Campus Map
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroImage}>
              <div className={styles.logoContainer}>
                <img src="/logo.png" alt="AggieRoomie Logo" className={styles.mainLogo} />
                <div className={styles.glowEffect}></div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.features}>
          <h2 className={styles.featuresTitle}>Why Choose AggieRoomie?</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔍</div>
              <h3>Smart Search</h3>
              <p>Filter dorms by location, room type, and budget to find your perfect match.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🗺️</div>
              <h3>Interactive Map</h3>
              <p>Explore dorm locations on our interactive campus map with detailed information.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>⭐</div>
              <h3>Real Reviews</h3>
              <p>See authentic Google reviews and ratings for each dorm building.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💰</div>
              <h3>Price Comparison</h3>
              <p>Compare rates and find the best value for your budget and preferences.</p>
            </div>
          </div>
        </div>

        <div className={styles.cta}>
          <h2>Ready to Find Your Perfect Dorm?</h2>
          <p>Join thousands of Aggies who have found their ideal living space with AggieRoomie.</p>
          <Link href="/search" className="btn btn-primary btn-lg">
            Get Started Now
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© 2025 AggieRoomie. Created by Suraj Singh M</p>
        </div>
      </footer>
    </div>
  );
} 