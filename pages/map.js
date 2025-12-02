import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import styles from '../styles/Map.module.css';

// Dynamically import MapContainer to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function Map() {
  const router = useRouter();
  const [dorms, setDorms] = useState([]);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [showDetailsCard, setShowDetailsCard] = useState(false);
  const [detailsDorm, setDetailsDorm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Center coordinates for Texas A&M University
  const center = [30.6150, -96.3400];
  const zoom = 16;

  useEffect(() => {
    setMounted(true);
    // Wait for Leaflet to be available
    const checkLeaflet = async () => {
      if (typeof window === 'undefined') return;
      
      // Try to get Leaflet from window first (if loaded via script)
      if (window.L) {
        setLeafletLoaded(true);
        return;
      }
      
      // Otherwise import it
      try {
        const leaflet = await import('leaflet');
        if (leaflet.default) {
          window.L = leaflet.default;
          setLeafletLoaded(true);
        }
      } catch (e) {
        console.warn('Failed to load Leaflet:', e);
        // Retry
        setTimeout(checkLeaflet, 100);
      }
    };
    checkLeaflet();
  }, []);

  useEffect(() => {
    const fetchDorms = async () => {
      try {
        const response = await fetch('/api/map');
        if (!response.ok) {
          throw new Error('Failed to fetch dorms');
        }
        const data = await response.json();
        setDorms(data);

        if (router.query.dorm) {
          const dorm = data.find(d => d.name === router.query.dorm);
          if (dorm) {
            setSelectedDorm(dorm);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDorms();
  }, [router.query.dorm]);

  const handleDormClick = (dorm) => {
    setSelectedDorm(dorm);
  };

  const handleShowDetails = (dorm) => {
    // Prevent any navigation
    if (typeof window !== 'undefined') {
      window.event?.preventDefault?.();
    }
    setDetailsDorm(dorm);
    setShowDetailsCard(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsCard(false);
    setDetailsDorm(null);
  };

  // Generate TAMU residence life URL for a dorm
  const getResLifeUrl = (dormName) => {
    if (!dormName) return '';
    // Convert to lowercase and remove "Hall" if present
    const name = dormName.toLowerCase().replace(/\s+hall\s*$/, '').trim();
    return `https://reslife.tamu.edu/${name}/`;
  };

  // Custom icon for markers - memoized and only created when Leaflet is loaded
  const customIcon = useMemo(() => {
    if (typeof window === 'undefined' || !window.L || !leafletLoaded) {
      return undefined;
    }
    
    try {
      const L = window.L;
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24C32 7.163 24.837 0 16 0z" fill="#500000" stroke="#ffffff" stroke-width="2"/>
            <circle cx="16" cy="16" r="6" fill="#ffffff"/>
          </svg>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      });
    } catch (e) {
      console.warn('Failed to create custom icon:', e);
      return undefined;
    }
  }, [leafletLoaded]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading campus map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorIcon}>⚠️</div>
        <p>Error: {error}</p>
        <p>Please check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Campus Map - AggieRoomie</title>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8324417197634076"
        crossorigin="anonymous"></script>
        <meta name="description" content="View dorm locations on Texas A&M campus map" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      </Head>

      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>AggieRoomie</span>
          </Link>
          <div className={styles.navActions}>
            <Link href="/search" className={styles.mapButton}>
              <span className={styles.mapIcon}>🔍</span>
              Search for Dorms
            </Link>
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
          <h1 className={styles.title}>Campus Map</h1>
          <p className={styles.description}>
            Explore dorm locations on the Texas A&M campus and find the perfect location for your college experience
          </p>
        </div>

        <div className={styles.mapContainer}>
          {mounted && (
            <MapContainer
              center={selectedDorm && selectedDorm.coordinates 
                ? [parseFloat(selectedDorm.coordinates.lat), parseFloat(selectedDorm.coordinates.lng)]
                : center}
              zoom={selectedDorm ? 17 : zoom}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {dorms.map((dorm) => {
                if (!dorm.coordinates || !dorm.coordinates.lat || !dorm.coordinates.lng) return null;
                
                const position = [parseFloat(dorm.coordinates.lat), parseFloat(dorm.coordinates.lng)];
                
                return (
                  <Marker
                    key={dorm.name}
                    position={position}
                    icon={customIcon}
                  >
                    <Popup>
                      <div className={styles.infoWindow}>
                        <h3>{dorm.name}</h3>
                        <p>{dorm.location || ''}</p>
                        <p><strong>Room Types:</strong> {dorm.roomTypes ? dorm.roomTypes.join(', ') : 'N/A'}</p>
                        <div className={styles.infoWindowActions}>
                          <button 
                            type="button"
                            className={styles.infoButton}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (e.nativeEvent) {
                                e.nativeEvent.stopImmediatePropagation();
                              }
                              handleShowDetails(dorm);
                              return false;
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            More Details
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
          <div className={styles.dormList}>
            <h2>Dorms ({dorms.length})</h2>
            <div className={styles.dormGrid}>
              {dorms.map((dorm) => (
                <div 
                  key={dorm.name}
                  className={`${styles.dormCard} ${selectedDorm?.name === dorm.name ? styles.selected : ''}`}
                  onClick={() => handleDormClick(dorm)}
                >
                  <h3>{dorm.name}</h3>
                  <p className={styles.location}>{dorm.location}</p>
                  {dorm.roomTypes && (
                    <div className={styles.details}>
                      <p><strong>Room Types:</strong> {dorm.roomTypes.join(', ')}</p>
                    </div>
                  )}
                  <div className={styles.actions}>
                    <button
                      className={styles.viewDetailsButton}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleShowDetails(dorm);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Details Popout Panel */}
      {showDetailsCard && detailsDorm && (
        <>
          <div className={styles.modalOverlay} onClick={handleCloseDetails}></div>
          <div className={styles.detailsModal}>
            <div className={styles.modalHeaderBar}>
              <button className={styles.modalClose} onClick={handleCloseDetails}>&times;</button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {detailsDorm.name}
                  <a 
                    href={getResLifeUrl(detailsDorm.name)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.modalOfficialLink}
                  >
                    🔗 link
                  </a>
                </h2>
              </div>

              <div className={styles.modalSection}>
                <div className={styles.modalInfoRow}>
                  <span className={styles.modalIcon}>📍</span>
                  <span className={styles.modalText}>{detailsDorm.location || 'Location not specified'}</span>
                </div>
              </div>

              {detailsDorm.roomTypes && detailsDorm.roomTypes.length > 0 && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Room Types</h3>
                  <div className={styles.modalTags}>
                    {detailsDorm.roomTypes.map((type, idx) => (
                      <span key={idx} className={styles.modalTag}>{type}</span>
                    ))}
                  </div>
                </div>
              )}

              {detailsDorm.rates && detailsDorm.rates.length > 0 && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Rates</h3>
                  <div className={styles.modalRates}>
                    {detailsDorm.rates.map((rate, idx) => (
                      <div key={idx} className={styles.modalRateItem}>
                        <span className={styles.modalRateType}>{rate.type}:</span>
                        <span className={styles.modalRateValue}>{rate.rate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailsDorm.buildingInfo && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Building Information</h3>
                  {detailsDorm.buildingInfo.yearBuilt && (
                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalIcon}>🏗️</span>
                      <span className={styles.modalText}>Year Built: {detailsDorm.buildingInfo.yearBuilt}</span>
                    </div>
                  )}
                  {detailsDorm.buildingInfo.bathroomType && (
                    <div className={styles.modalInfoRow}>
                      <span className={styles.modalIcon}>🚿</span>
                      <span className={styles.modalText}>Bathroom: {detailsDorm.buildingInfo.bathroomType}</span>
                    </div>
                  )}
                </div>
              )}

              {detailsDorm.googleReview && (
                <div className={styles.modalSection}>
                  <h3 className={styles.modalSectionTitle}>Reviews</h3>
                  <div className={styles.modalRating}>
                    <span className={styles.modalRatingStars}>
                      {'★'.repeat(Math.floor(detailsDorm.googleReview.rating || 0))}
                      {'☆'.repeat(5 - Math.floor(detailsDorm.googleReview.rating || 0))}
                    </span>
                    <span className={styles.modalRatingValue}>
                      {detailsDorm.googleReview.rating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className={styles.modalRatingCount}>
                      ({detailsDorm.googleReview.reviews || 0} reviews)
                    </span>
                  </div>
                  {detailsDorm.googleReview.recentReviews && detailsDorm.googleReview.recentReviews.length > 0 && (
                    <div className={styles.modalReviews}>
                      {detailsDorm.googleReview.recentReviews.slice(0, 3).map((review, idx) => (
                        <div key={idx} className={styles.modalReviewItem}>
                          <div className={styles.modalReviewHeader}>
                            <span className={styles.modalReviewAuthor}>{review.author || 'Anonymous'}</span>
                            <span className={styles.modalReviewRating}>
                              {'★'.repeat(review.rating || 0)}
                            </span>
                          </div>
                          <p className={styles.modalReviewText}>{review.text || ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <footer className={styles.footer}>
        <p>© 2025 AggieRoomie. Suraj Singh M</p>
      </footer>
    </div>
  );
}
