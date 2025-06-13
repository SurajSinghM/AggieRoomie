import { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Map.module.css';

export default function Map() {
  const [dorms, setDorms] = useState([]);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    // Load dorms data
    fetch('/api/dorms')
      .then(res => res.json())
      .then(data => setDorms(data))
      .catch(err => console.error('Error loading dorms:', err));

    // Initialize map
    const initMap = () => {
      const mapInstance = new window.google.maps.Map(document.getElementById('map'), {
        center: { lat: 30.6280, lng: -96.3344 }, // Texas A&M University center
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
    };

    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initMap`;
      script.async = true;
      script.defer = true;
      window.initMap = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      // Cleanup
      if (window.google) {
        delete window.initMap;
      }
    };
  }, []);

  useEffect(() => {
    if (map && dorms.length > 0) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      const newMarkers = [];

      // Add markers for each dorm
      dorms.forEach(dorm => {
        if (dorm.coordinates && dorm.coordinates.latitude && dorm.coordinates.longitude) {
          const marker = new window.google.maps.Marker({
            position: {
              lat: parseFloat(dorm.coordinates.latitude),
              lng: parseFloat(dorm.coordinates.longitude)
            },
            map,
            title: dorm.name,
            animation: window.google.maps.Animation.DROP
          });

          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="${styles.infoWindow}">
                <h3>${dorm.name}</h3>
                <p>Location: ${dorm.location}</p>
                <p>Room Types: ${dorm.roomTypes.join(', ')}</p>
                <p>Rates: $${dorm.rates.double}/semester (Double)</p>
                ${dorm.rates.single ? `<p>Rates: $${dorm.rates.single}/semester (Single)</p>` : ''}
                <p>Rating: ${dorm.rating || 'N/A'} ⭐</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          newMarkers.push(marker);
        }
      });

      setMarkers(newMarkers);
    }
  }, [map, dorms]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Campus Map - AggieRoomie</title>
        <meta name="description" content="Interactive map of Texas A&M University dorms" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Campus Map</h1>
        <p className={styles.description}>
          Explore the locations of all dorm halls at Texas A&M University
        </p>
        <div id="map" className={styles.map}></div>
      </main>
    </div>
  );
} 