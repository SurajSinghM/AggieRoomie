import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Loader } from '@googlemaps/js-api-loader';
import styles from '../styles/Map.module.css';

export default function Map() {
  const router = useRouter();
  const [dorms, setDorms] = useState([]);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

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
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        const google = await loader.load();
        const mapInstance = new google.maps.Map(document.getElementById('map'), {
          center: { lat: 30.6280, lng: -96.3344 }, // Texas A&M University coordinates
          zoom: 15,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        setMap(mapInstance);
      } catch (err) {
        setError('Failed to load Google Maps');
      }
    };

    if (!map) {
      initMap();
    }
  }, [map]);

  useEffect(() => {
    if (map && dorms.length > 0) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      const newMarkers = [];

      // Add markers for each dorm
      dorms.forEach(dorm => {
        if (dorm.coordinates) {
          const marker = new google.maps.Marker({
            position: dorm.coordinates,
            map,
            title: dorm.name,
            animation: google.maps.Animation.DROP
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="${styles.infoWindow}">
                <h3>${dorm.name}</h3>
                <p>${dorm.location}</p>
                <p><strong>Room Types:</strong> ${dorm.roomTypes.join(', ')}</p>
                <p><strong>Rates:</strong> $${dorm.rates.min} - $${dorm.rates.max}/semester</p>
                <div class="${styles.infoWindowActions}">
                  <a href="/compare?dorm=${encodeURIComponent(dorm.name)}" class="btn btn-sm btn-primary">Compare</a>
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
  }, [map, dorms]);

  useEffect(() => {
    if (map && selectedDorm && selectedDorm.coordinates) {
      map.panTo(selectedDorm.coordinates);
      map.setZoom(17);
    }
  }, [map, selectedDorm]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Campus Map - AggieRoomie</title>
        <meta name="description" content="View dorm locations on Texas A&M campus map" />
      </Head>

      <nav className={`navbar navbar-expand-lg ${styles.navbar}`}>
        <div className="container">
          <Link href="/" className={`navbar-brand ${styles.navbarBrand}`}>
            AggieRoomie
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link href="/" className="nav-link">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/search" className="nav-link">
                  Search
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/map" className="nav-link active">
                  Map
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>Campus Map</h1>
        <p className={styles.description}>
          Explore dorm locations on the Texas A&M campus
        </p>

        <div className={styles.mapContainer}>
          <div id="map" className={styles.map}></div>
          <div className={styles.dormList}>
            <h2>Dorms</h2>
            <div className={styles.dormGrid}>
              {dorms.map((dorm) => (
                <div
                  key={dorm.name}
                  className={`${styles.card} ${selectedDorm?.name === dorm.name ? styles.selected : ''}`}
                  onClick={() => setSelectedDorm(dorm)}
                >
                  <h3>{dorm.name}</h3>
                  <p className={styles.location}>{dorm.location}</p>
                  <div className={styles.details}>
                    <p><strong>Room Types:</strong> {dorm.roomTypes.join(', ')}</p>
                    <p><strong>Rates:</strong> ${dorm.rates.min} - ${dorm.rates.max}/semester</p>
                  </div>
                  <div className={styles.actions}>
                    <Link href={`/compare?dorm=${dorm.name}`} className="btn btn-outline-primary">
                      Compare
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2024 AggieRoomie - Texas A&M University</p>
      </footer>
    </div>
  );
} 