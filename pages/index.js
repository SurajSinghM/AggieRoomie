import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();
  const [averageRating, setAverageRating] = useState('4.8');

  useEffect(() => {
    const fetchAverageRating = async () => {
      try {
        const response = await fetch('/api/dorms');
        if (!response.ok) {
          throw new Error('Failed to fetch dorms');
        }
        const dorms = await response.json();
        
        // Calculate average rating from all dorms with ratings
        const ratings = dorms
          .map(dorm => dorm.googleReview?.rating)
          .filter(rating => rating !== undefined && rating !== null);
        
        if (ratings.length > 0) {
          const sum = ratings.reduce((acc, rating) => acc + rating, 0);
          const average = sum / ratings.length;
          setAverageRating(average.toFixed(1));
        }
      } catch (err) {
        console.error('Error fetching average rating:', err);
        // Keep default value if fetch fails
      }
    };

    fetchAverageRating();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>AggieRoomie - Your Perfect Dorm Finder</title>
        <meta name="description" content="Find your perfect dorm at Texas A&M University with our comprehensive search and comparison tools" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <span className={styles.logoText}>AggieRoomie</span>
          </div>
          <div className={styles.navActions}>
            <Link href="/search" className={styles.navLink}>Search</Link>
            <Link href="/map" className={styles.navLink}>Map</Link>
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
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>🏆 #1 Dorm Finder for Texas A&M</div>
            <h1 className={styles.heroTitle}>
              Find Your Perfect
              <span className={styles.highlight}> Aggie Home</span>
            </h1>
            <p className={styles.heroDescription}>
              Discover the ideal living space at Texas A&M University. Compare dorms, explore locations, 
              read authentic reviews, and make the best decision for your college experience.
            </p>
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>20+</div>
                <div className={styles.statLabel}>Dorms Listed</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>100+</div>
                <div className={styles.statLabel}>Students Helped</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{averageRating}★</div>
                <div className={styles.statLabel}>Average Dorm Rating</div>
              </div>
            </div>
            <div className={styles.heroActions}>
              <Link href="/search" className={styles.primaryButton}>
                <span className={styles.buttonIcon}>🔍</span>
                <span>Start Searching</span>
                <span className={styles.buttonArrow}>→</span>
              </Link>
              <Link href="/map" className={styles.secondaryButton}>
                <span className={styles.buttonIcon}>🗺️</span>
                <span>Explore Map</span>
              </Link>
              <Link href="/search-apartments" className={styles.tertiaryButton}>
                <span className={styles.buttonIcon}>🏢</span>
                <span>Find Apartments</span>
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroImageCard}>
              <img src="/logo.png" alt="AggieRoomie" className={styles.heroLogo} />
              <div className={styles.cardGlow}></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Everything You Need</h2>
            <p className={styles.sectionSubtitle}>Powerful tools to help you find your perfect dorm</p>
          </div>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>🔍</div>
              </div>
              <h3 className={styles.featureTitle}>Smart Search</h3>
              <p className={styles.featureDescription}>
                Filter dorms by location, room type, budget, and amenities. Find exactly what you're looking for with our advanced search tools.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>🗺️</div>
              </div>
              <h3 className={styles.featureTitle}>Interactive Map</h3>
              <p className={styles.featureDescription}>
                Explore dorm locations on our interactive campus map. See distances, nearby facilities, and get directions to each hall.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>⭐</div>
              </div>
              <h3 className={styles.featureTitle}>Real Reviews</h3>
              <p className={styles.featureDescription}>
                Read authentic Google reviews from current and former residents. Get honest insights about each dorm before you decide.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>💰</div>
              </div>
              <h3 className={styles.featureTitle}>Price Comparison</h3>
              <p className={styles.featureDescription}>
                Compare rates across different room types and halls. Find the best value for your budget and preferences.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>🎯</div>
              </div>
              <h3 className={styles.featureTitle}>Match Scoring</h3>
              <p className={styles.featureDescription}>
                Our AI-powered match score helps you find dorms that best fit your preferences and lifestyle.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <div className={styles.featureIcon}>📊</div>
              </div>
              <h3 className={styles.featureTitle}>Detailed Info</h3>
              <p className={styles.featureDescription}>
                Access comprehensive information about each dorm including amenities, building info, and room dimensions.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className={styles.howItWorks}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionSubtitle}>Find your perfect dorm in three simple steps</p>
          </div>
          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Set Your Preferences</h3>
              <p className={styles.stepDescription}>
                Choose your preferred location, room type, and budget range. Our system will filter dorms based on your criteria.
              </p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Explore & Compare</h3>
              <p className={styles.stepDescription}>
                Browse through detailed dorm profiles, compare rates, read reviews, and explore locations on our interactive map.
              </p>
            </div>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Make Your Decision</h3>
              <p className={styles.stepDescription}>
                Use match scores and comprehensive information to make an informed decision. Apply directly through TAMU Housing.
              </p>
            </div>
          </div>
        </section>

        {/* Campus Info Section */}
        <section className={styles.campusInfo}>
          <div className={styles.campusInfoContent}>
            <div className={styles.campusInfoText}>
              <h2 className={styles.campusInfoTitle}>About Texas A&M Residence Halls</h2>
              <p className={styles.campusInfoDescription}>
                Texas A&M University offers a variety of on-campus housing options to fit every student's needs. 
                From traditional residence halls to modern suite-style living, there's something for everyone.
              </p>
              <div className={styles.campusInfoList}>
                <div className={styles.infoListItem}>
                  <span className={styles.infoIcon}>🏛️</span>
                  <div>
                    <strong>Residence Halls</strong>
                    <p>Traditional and modern residence halls with various room configurations</p>
                  </div>
                </div>
                <div className={styles.infoListItem}>
                  <span className={styles.infoIcon}>🏘️</span>
                  <div>
                    <strong>White Creek</strong>
                    <p>Apartment-style living with independent living spaces</p>
                  </div>
                </div>
                <div className={styles.infoListItem}>
                  <span className={styles.infoIcon}>🌳</span>
                  <div>
                    <strong>Gardens Apartments</strong>
                    <p>Family housing options for graduate students and families</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.campusInfoVisual}>
              <div className={styles.infoCard}>
                <div className={styles.infoCardHeader}>
                  <span className={styles.infoCardIcon}>📍</span>
                  <h3>Quick Facts</h3>
                </div>
                <div className={styles.infoCardContent}>
                  <div className={styles.factItem}>
                    <span className={styles.factLabel}>Total Halls</span>
                    <span className={styles.factValue}>20+</span>
                  </div>
                  <div className={styles.factItem}>
                    <span className={styles.factLabel}>Room Types</span>
                    <span className={styles.factValue}>Single, Double, Suite</span>
                  </div>
                  <div className={styles.factItem}>
                    <span className={styles.factLabel}>Bathroom Styles</span>
                    <span className={styles.factValue}>Community, Suite, Private</span>
                  </div>
                  <div className={styles.factItem}>
                    <span className={styles.factLabel}>Price Range</span>
                    <span className={styles.factValue}>$2,500 - $7,400/sem</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.cta}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Find Your Perfect Dorm?</h2>
            <p className={styles.ctaDescription}>
              Join thousands of Aggies who have found their ideal living space with AggieRoomie. 
              Start your search today and make your college experience unforgettable.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/search" className={styles.ctaButton}>
                <span>Start Searching Now</span>
                <span className={styles.buttonArrow}>→</span>
              </Link>
              <Link href="/map" className={styles.ctaButtonSecondary}>
                <span>Explore Campus Map</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>AggieRoomie</h3>
            <p className={styles.footerDescription}>
              Your comprehensive dorm finder for Texas A&M University. Find, compare, and choose your perfect Aggie home.
            </p>
          </div>
          <div className={styles.footerSection}>
            <h4 className={styles.footerSectionTitle}>Quick Links</h4>
            <Link href="/search" className={styles.footerLink}>Dorm Search</Link>
            <Link href="/map" className={styles.footerLink}>Campus Map</Link>
            <Link href="/search-apartments" className={styles.footerLink}>Apartment Search</Link>
          </div>
          <div className={styles.footerSection}>
            <h4 className={styles.footerSectionTitle}>Resources</h4>
            <a href="https://reslife.tamu.edu" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              TAMU Residence Life
            </a>
            <a href="https://www.tamu.edu" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              Texas A&M University
            </a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2025 AggieRoomie. Created by Suraj Singh M</p>
        </div>
      </footer>
    </div>
  );
}
