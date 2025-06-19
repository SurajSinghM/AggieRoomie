import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Map.module.css';

export default function Map() {
  const router = useRouter();
  const [dorms, setDorms] = useState([]);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [google, setGoogle] = useState(null);

  useEffect(() => {
    const fetchDorms = async () => {
      try {
        const response = await fetch('/api/map');
        if (!response.ok) {
          throw new Error('Failed to fetch dorms');
        }
        const data = await response.json();
        setDorms(data);

        // If a dorm is specified in the URL, select it
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

  useEffect(() => {
    const initMap = async () => {
      try {
        // Check if Google Maps API key is available
        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
          throw new Error('Google Maps API key not configured');
        }

        // Wait for the DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if the map container exists
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
          // Retry after a short delay
          setTimeout(() => initMap(), 500);
          return;
        }

        // Load Google Maps API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          try {
            const mapInstance = new window.google.maps.Map(mapContainer, {
              center: { lat: 30.6150, lng: -96.3400 }, // Adjusted to better view of campus dorms
              zoom: 16,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                },
                {
                  featureType: 'transit',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ],
              mapTypeControl: true,
              mapTypeControlOptions: {
                style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: window.google.maps.ControlPosition.TOP_RIGHT
              },
              streetViewControl: false,
              fullscreenControl: true,
              zoomControl: true,
              mapTypeId: window.google.maps.MapTypeId.SATELLITE
            });

            setMap(mapInstance);
            setGoogle(window.google);
          } catch (mapError) {
            setError(`Failed to create map: ${mapError.message}`);
          }
        };

        script.onerror = (error) => {
          setError('Failed to load Google Maps API - check your API key and internet connection');
        };

        document.head.appendChild(script);
      } catch (err) {
        setError(`Failed to load Google Maps: ${err.message}`);
      }
    };

    if (!map && !google) {
      initMap();
    }
  }, [map, google]);

  useEffect(() => {
    if (map && google && dorms.length > 0) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      const newMarkers = [];

      // Add markers for each dorm
      dorms.forEach(dorm => {
        if (dorm.coordinates && dorm.coordinates.lat && dorm.coordinates.lng) {
          const marker = new google.maps.Marker({
            position: { 
              lat: parseFloat(dorm.coordinates.lat), 
              lng: parseFloat(dorm.coordinates.lng) 
            },
            map,
            title: dorm.name,
            animation: google.maps.Animation.DROP,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 28 12 28s12-19.5 12-28c0-6.63-5.37-12-12-12z" fill="#500000"/>
                  <circle cx="12" cy="12" r="6" fill="white"/>
                  <circle cx="12" cy="12" r="3" fill="#500000"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 40),
              anchor: new google.maps.Point(12, 40)
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="${styles.infoWindow}">
                <h3>${dorm.name}</h3>
                <p>${dorm.location}</p>
                <p><strong>Room Types:</strong> ${dorm.roomTypes ? dorm.roomTypes.join(', ') : 'N/A'}</p>
                <div class="${styles.infoWindowActions}">
                  <a href="/search?dorm=${encodeURIComponent(dorm.name)}" class="btn btn-primary">View Details</a>
                </div>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
            setSelectedDorm(dorm);
          });

          newMarkers.push(marker);
        }
      });

      setMarkers(newMarkers);
    }
  }, [map, google, dorms]);

  useEffect(() => {
    if (map && selectedDorm && selectedDorm.coordinates) {
      const position = { 
        lat: parseFloat(selectedDorm.coordinates.lat), 
        lng: parseFloat(selectedDorm.coordinates.lng) 
      };
      map.panTo(position);
      map.setZoom(17);
    }
  }, [map, selectedDorm]);

  const handleDormClick = (dorm) => {
    setSelectedDorm(dorm);
    if (map && dorm.coordinates) {
      const position = { 
        lat: parseFloat(dorm.coordinates.lat), 
        lng: parseFloat(dorm.coordinates.lng) 
      };
      map.panTo(position);
      map.setZoom(17);
    }
  };

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
        <p>Please check your Google Maps API key configuration.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Campus Map - AggieRoomie</title>
        <meta name="description" content="View dorm locations on Texas A&M campus map" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
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
          <div id="map" className={styles.map}></div>
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
                    <Link href={`/search?dorm=${encodeURIComponent(dorm.name)}`} className={styles.viewDetailsButton}>
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 AggieRoomie. Suraj Singh M</p>
      </footer>
    </div>
  );
} 