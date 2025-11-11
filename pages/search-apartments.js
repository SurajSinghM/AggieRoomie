import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import styles from '../styles/Search.module.css';
import mapStyles from '../styles/Map.module.css';

// Dynamically import MapContainer to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

export default function SearchApartments() {
  const [apartments, setApartments] = useState([]);
  const [selectedApt, setSelectedApt] = useState(null);
  const [aptDetails, setAptDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [showDetailsCard, setShowDetailsCard] = useState(false);
  const [detailsApartment, setDetailsApartment] = useState(null);

  const defaultCenter = [30.6152, -96.3410];

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
    async function fetchApartments() {
      try {
        const radiusMeters = 4828;
        const location = 'Texas A&M University, College Station, TX';
        const res = await fetch(`/api/apartments?near=${encodeURIComponent(location)}&radius=${radiusMeters}`);
        if (!res.ok) return;
        const data = await res.json();
        setApartments(data.apartments);
      } finally {
        setLoading(false);
      }
    }
    fetchApartments();
  }, []);


  const handleShowDetails = async (apartment) => {
    // Prevent any navigation
    if (typeof window !== 'undefined') {
      window.event?.preventDefault?.();
    }
    
    setDetailsLoading(true);
    setAptDetails(null);
    
    const local = apartments.find(a => a.placeId === apartment.placeId || a.name === apartment.name);
    if (local) {
      setSelectedApt(local);
      
      const detailsFromLocal = {
        name: local.name,
        formatted_address: local.address || null,
        formatted_phone_number: local.phone || null,
        website: local.website || null,
        rating: local.rating || null,
        user_ratings_total: local.userRatingsTotal || null,
        reviews: (local.googleReview && local.googleReview.recentReviews) ? local.googleReview.recentReviews.map(r => ({ author_name: r.author, rating: r.rating, text: r.text })) : null,
        photos: local.photoUrl ? [{ photo_reference: null }] : null
      };
      setAptDetails(detailsFromLocal);
      setDetailsApartment({ ...local, details: detailsFromLocal });
      setShowDetailsCard(true);
      setDetailsLoading(false);
      return;
    }

    setSelectedApt(null);
    try {
      const placeId = apartment.placeId || apartment;
      const res = await fetch(`/api/google-places?placeId=${placeId}`);
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();
      setAptDetails(data);
      setDetailsApartment({ ...apartment, details: data });
      setShowDetailsCard(true);
    } catch (err) {
      console.warn('Failed to fetch place details:', err && err.message);
      setAptDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setShowDetailsCard(false);
    setDetailsApartment(null);
    setSelectedApt(null);
    setAptDetails(null);
  };

  // Custom icon for apartment markers - memoized and only created when Leaflet is loaded
  const apartmentIcon = useMemo(() => {
    if (typeof window === 'undefined' || !window.L || !leafletLoaded) {
      return undefined;
    }
    
    try {
      const L = window.L;
      return L.divIcon({
        className: 'custom-apartment-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: #1976d2;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          ">🏢</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    } catch (e) {
      console.warn('Failed to create apartment icon:', e);
      return undefined;
    }
  }, [leafletLoaded]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Apartment Search | AggieRoomie</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      </Head>
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>AggieRoomie</span>
          </Link>
          <div className={styles.navActions}>
            <Link href="/map" className={styles.mapButton}>
              <span className={styles.mapIcon}>🗺️</span>
              View Campus Map
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
        <div style={{ display: 'flex', height: '75vh', minHeight: 500 }}>
          <div style={{ width: 420, maxWidth: '100%', overflowY: 'auto', background: '#181c20', color: '#fff', borderRadius: 24, marginRight: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
            <div style={{ fontWeight: 800, fontSize: 36, color: '#fff', textAlign: 'center', margin: '32px 0 8px 0' }}>Apartment Search</div>
            <div style={{ color: '#b3b3b3', textAlign: 'center', marginBottom: 24, fontSize: 17 }}>
              Find apartments near Texas A&M University. Discover the best off-campus living options!
            </div>
            <div className={styles.results} style={{ background: 'none', boxShadow: 'none', border: 'none', padding: 0 }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
                  <div className={styles.loadingSpinner} style={{ width: 48, height: 48, border: '6px solid #eee', borderTop: '6px solid #800000', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }}></div>
                  <div style={{ color: '#b3b3b3', fontWeight: 600, fontSize: 18 }}>Loading apartments...</div>
                </div>
              ) : apartments.length > 0 ? (
                <div>
                  {apartments.map((apt, idx) => (
                    <div key={apt.placeId || idx} style={{ display: 'flex', alignItems: 'center', background: '#23272b', borderRadius: 16, margin: '16px 16px 0 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', padding: 16 }}>
                      {apt.photoUrl ? (
                        <img
                          src={apt.photoUrl}
                          alt={apt.name + ' photo'}
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, marginRight: 16 }}
                        />
                      ) : (
                        <div style={{ width: 80, height: 80, background: '#2d3238', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#b3a369', borderRadius: 12, marginRight: 16 }}>
                          🏢
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{apt.name}</div>
                          {apt.rating && (
                            <div style={{ background: '#23272b', border: '1px solid #444', borderRadius: 16, padding: '2px 10px', display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: 15, color: '#ffd700' }}>
                              <span style={{ marginRight: 4 }}>★</span>
                              <span style={{ color: '#fff', marginRight: 4 }}>{apt.rating}</span>
                              <span style={{ color: '#b3b3b3' }}>({apt.userRatingsTotal})</span>
                            </div>
                          )}
                        </div>
                        <div style={{ color: '#b3a369', fontWeight: 500, fontSize: 14, margin: '2px 0 2px 0' }}>{apt.types && apt.types[0] ? apt.types[0].replace(/_/g, ' ') : 'Apartment'}</div>
                        <div style={{ color: '#fff', fontSize: 14, marginBottom: 2 }}><span style={{ color: '#ff5e5e', marginRight: 4 }}>📍</span>{apt.address}</div>
                        {apt.distance && apt.distance.drive && apt.distance.drive.distance && (
                          <div style={{ color: '#b3b3b3', fontSize: 13, marginBottom: 2 }}>
                            <strong>Distance:</strong> {((apt.distance.drive.distance.value / 1609.34).toFixed(2))} mi
                            {apt.distance.drive.duration && (
                              <span style={{ marginLeft: 8 }}>🚗 {apt.distance.drive.duration.text} drive</span>
                            )}
                            {apt.distance.bike && apt.distance.bike.duration && (
                              <span style={{ marginLeft: 8 }}>🚲 {apt.distance.bike.duration.text} bike</span>
                            )}
                            {apt.distance.walk && apt.distance.walk.duration && (
                              <span style={{ marginLeft: 8 }}>🚶 {apt.distance.walk.duration.text} walk</span>
                            )}
                          </div>
                        )}
                        <button
                          style={{ color: '#fff', background: '#800000', borderRadius: 8, padding: '4px 12px', fontWeight: 600, fontSize: 13, border: 'none', marginTop: 6, display: 'inline-block', cursor: 'pointer' }}
                          onClick={() => handleShowDetails(apt)}
                        >
                          More Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noResults}>
                  <span className={styles.noResultsIcon}>🏢</span>
                  <p>No apartments found. Try adjusting your search.</p>
                </div>
              )}
            </div>
          </div>
          {mounted && (
            <div style={{ flex: 1, minWidth: 0, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
              <MapContainer
                center={defaultCenter}
                zoom={14}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {apartments.map((apt) => {
                  if (!apt.location || typeof apt.location.lat !== 'number' || typeof apt.location.lng !== 'number') return null;
                  
                  return (
                    <Marker
                      key={apt.placeId || apt.name}
                      position={[apt.location.lat, apt.location.lng]}
                      icon={apartmentIcon}
                    >
                      <Popup>
                        <div className={mapStyles.infoWindow}>
                          <h3>{apt.name}</h3>
                          <p>{apt.address || ''}</p>
                          {apt.rating && (
                            <p><strong>Rating:</strong> {apt.rating} ({apt.userRatingsTotal || 0} reviews)</p>
                          )}
                          <div className={mapStyles.infoWindowActions}>
                            <button 
                              type="button"
                              className={mapStyles.infoButton}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.nativeEvent) {
                                  e.nativeEvent.stopImmediatePropagation();
                                }
                                handleShowDetails(apt);
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
            </div>
          )}
        </div>
        {/* Details Popout Panel */}
        {showDetailsCard && detailsApartment && (
          <>
            <div className={mapStyles.modalOverlay} onClick={handleCloseDetails}></div>
            <div className={mapStyles.detailsModal}>
              <div className={mapStyles.modalHeaderBar}>
                <button className={mapStyles.modalClose} onClick={handleCloseDetails}>&times;</button>
              </div>
              <div className={mapStyles.modalContent}>
                <div className={mapStyles.modalHeader}>
                  <h2 className={mapStyles.modalTitle}>
                    {detailsApartment.name}
                    {detailsApartment.details?.website && (
                      <a 
                        href={detailsApartment.details.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={mapStyles.modalOfficialLink}
                      >
                        🔗 link
                      </a>
                    )}
                  </h2>
                </div>

                <div className={mapStyles.modalSection}>
                  <div className={mapStyles.modalInfoRow}>
                    <span className={mapStyles.modalIcon}>📍</span>
                    <span className={mapStyles.modalText}>{detailsApartment.address || detailsApartment.details?.formatted_address || 'Address not available'}</span>
                  </div>
                </div>

                {detailsApartment.rating && (
                  <div className={mapStyles.modalSection}>
                    <h3 className={mapStyles.modalSectionTitle}>Rating</h3>
                    <div className={mapStyles.modalRating}>
                      <span className={mapStyles.modalRatingStars}>
                        {'★'.repeat(Math.floor(detailsApartment.rating || 0))}
                        {'☆'.repeat(5 - Math.floor(detailsApartment.rating || 0))}
                      </span>
                      <span className={mapStyles.modalRatingValue}>
                        {detailsApartment.rating?.toFixed(1) || 'N/A'}
                      </span>
                      <span className={mapStyles.modalRatingCount}>
                        ({detailsApartment.userRatingsTotal || detailsApartment.details?.user_ratings_total || 0} reviews)
                      </span>
                    </div>
                  </div>
                )}

                {detailsApartment.details?.formatted_phone_number && (
                  <div className={mapStyles.modalSection}>
                    <div className={mapStyles.modalInfoRow}>
                      <span className={mapStyles.modalIcon}>📞</span>
                      <a href={`tel:${detailsApartment.details.formatted_phone_number}`} className={mapStyles.modalText} style={{ color: 'var(--aggie-maroon)', textDecoration: 'underline' }}>
                        {detailsApartment.details.formatted_phone_number}
                      </a>
                    </div>
                  </div>
                )}

                {detailsApartment.distance && (
                  <div className={mapStyles.modalSection}>
                    <h3 className={mapStyles.modalSectionTitle}>Distance</h3>
                    {detailsApartment.distance.drive && detailsApartment.distance.drive.distance && (
                      <div className={mapStyles.modalInfoRow}>
                        <span className={mapStyles.modalIcon}>🚗</span>
                        <span className={mapStyles.modalText}>
                          {((detailsApartment.distance.drive.distance.value / 1609.34).toFixed(2))} mi
                          {detailsApartment.distance.drive.duration && ` (${detailsApartment.distance.drive.duration.text})`}
                        </span>
                      </div>
                    )}
                    {detailsApartment.distance.walk && detailsApartment.distance.walk.duration && (
                      <div className={mapStyles.modalInfoRow}>
                        <span className={mapStyles.modalIcon}>🚶</span>
                        <span className={mapStyles.modalText}>{detailsApartment.distance.walk.duration.text} walk</span>
                      </div>
                    )}
                    {detailsApartment.distance.bike && detailsApartment.distance.bike.duration && (
                      <div className={mapStyles.modalInfoRow}>
                        <span className={mapStyles.modalIcon}>🚲</span>
                        <span className={mapStyles.modalText}>{detailsApartment.distance.bike.duration.text} bike</span>
                      </div>
                    )}
                  </div>
                )}

                {detailsApartment.details?.reviews && detailsApartment.details.reviews.length > 0 && (
                  <div className={mapStyles.modalSection}>
                    <h3 className={mapStyles.modalSectionTitle}>Reviews</h3>
                    <div className={mapStyles.modalReviews}>
                      {detailsApartment.details.reviews.slice(0, 3).map((review, idx) => (
                        <div key={idx} className={mapStyles.modalReviewItem}>
                          <div className={mapStyles.modalReviewHeader}>
                            <span className={mapStyles.modalReviewAuthor}>{review.author_name || 'Anonymous'}</span>
                            <span className={mapStyles.modalReviewRating}>
                              {'★'.repeat(review.rating || 0)}
                            </span>
                          </div>
                          <p className={mapStyles.modalReviewText}>{review.text || ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© 2025 AggieRoomie. Created by Suraj Singh M</p>
        </div>
      </footer>
    </div>
  );
}
