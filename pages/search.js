import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Search.module.css';
import { dorms } from '../data/dorms';
import { locations } from '../data/locations';
import { roomTypes } from '../data/roomTypes';

// Add Google Places API key
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export default function Search() {
  const router = useRouter();
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    location: '',
    roomType: '',
    budget: ''
  });
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [googleReviews, setGoogleReviews] = useState({});

  useEffect(() => {
    const fetchDorms = async () => {
      try {
        const response = await fetch('/api/dorms');
        if (!response.ok) {
          throw new Error('Failed to fetch dorms');
        }
        const data = await response.json();
        setDorms(data);
      } catch (err) {
        console.error('Error fetching dorms:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDorms();
  }, []);

  // Function to fetch Google Places data
  const fetchGooglePlacesData = async (dormName) => {
    try {
      console.log('Fetching data for:', dormName);
      
      // First, search for the place
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        dormName + ' Texas A&M University'
      )}&key=${GOOGLE_PLACES_API_KEY}`;
      
      console.log('Search URL:', searchUrl);
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      console.log('Search response:', data);

      if (data.results && data.results.length > 0) {
        const placeId = data.results[0].place_id;
        console.log('Found place ID:', placeId);
        
        // Fetch detailed place information
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`;
        console.log('Details URL:', detailsUrl);
        
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        console.log('Details response:', detailsData);
        
        if (detailsData.result) {
          const reviewData = {
            rating: detailsData.result.rating || 0,
            reviews: detailsData.result.user_ratings_total || 0
          };
          console.log('Extracted review data:', reviewData);
          return reviewData;
        }
      } else {
        console.log('No results found for:', dormName);
      }
      return null;
    } catch (error) {
      console.error('Error fetching Google Places data for', dormName, ':', error);
      return null;
    }
  };

  // Update useEffect to fetch Google reviews
  useEffect(() => {
    const fetchReviews = async () => {
      console.log('Starting to fetch reviews for', dorms.length, 'dorms');
      const reviews = {};
      
      for (const dorm of dorms) {
        console.log('Processing dorm:', dorm.name);
        const placeData = await fetchGooglePlacesData(dorm.name);
        if (placeData) {
          reviews[dorm.name] = placeData;
          console.log('Added review data for:', dorm.name, placeData);
        }
      }
      
      console.log('Final reviews object:', reviews);
      setGoogleReviews(reviews);
    };

    if (dorms.length > 0) {
      console.log('Dorms data available, starting review fetch');
      fetchReviews();
    } else {
      console.log('No dorms data available yet');
    }
  }, [dorms]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    setShowResults(true);
  };

  const calculateMatchScore = (dorm) => {
    let score = 0;
    const maxScore = 10;

    // Location match (2 points)
    if (filters.location) {
      if (dorm.location === filters.location) {
        score += 2;
      }
    } else {
      score += 2; // Full points if no location filter
    }

    // Room type match (2 points)
    if (filters.roomType) {
      if (dorm.roomTypes.includes(filters.roomType)) {
        score += 2;
      }
    } else {
      score += 2; // Full points if no room type filter
    }

    // Budget match (3 points)
    if (filters.budget) {
      const budget = parseFloat(filters.budget);
      let dormRates = [];
      
      if (Array.isArray(dorm.rates)) {
        dormRates = dorm.rates.map(rate => parseFloat(rate.rate.replace('$', '').replace(',', '')));
      } else if (dorm.rates && typeof dorm.rates === 'object') {
        dormRates = [dorm.rates.min, dorm.rates.max];
      }

      if (dormRates.length > 0) {
        const minRate = Math.min(...dormRates);
        const maxRate = Math.max(...dormRates);
        const avgRate = (minRate + maxRate) / 2;

        // Calculate how well the rates match the budget
        if (maxRate <= budget) {
          score += 3; // Perfect match - all rates within budget
        } else if (avgRate <= budget) {
          score += 2; // Good match - average rate within budget
        } else if (minRate <= budget) {
          score += 1; // Partial match - some options within budget
        }
      }
    } else {
      score += 3; // Full points if no budget filter
    }

    // Building age factor (1 point)
    if (dorm.buildingInfo && dorm.buildingInfo.yearBuilt) {
      const yearBuilt = parseInt(dorm.buildingInfo.yearBuilt);
      const currentYear = new Date().getFullYear();
      const age = currentYear - yearBuilt;

      if (age <= 5) {
        score += 1; // New building
      } else if (age <= 10) {
        score += 0.75; // Relatively new
      } else if (age <= 20) {
        score += 0.5; // Moderately old
      } else {
        score += 0.25; // Older building
      }
    }

    // Google rating factor (2 points)
    const googleData = googleReviews[dorm.name];
    if (googleData) {
      const rating = googleData.rating;
      const reviewCount = googleData.reviews;

      // Base score on rating
      if (rating >= 4.5) {
        score += 1.5;
      } else if (rating >= 4.0) {
        score += 1;
      } else if (rating >= 3.5) {
        score += 0.5;
      }

      // Bonus for number of reviews (up to 0.5 points)
      if (reviewCount >= 100) {
        score += 0.5;
      } else if (reviewCount >= 50) {
        score += 0.25;
      }
    }

    // Normalize score to 10
    return Math.round((score / maxScore) * 10);
  };

  const getMatchColor = (score) => {
    if (score >= 8) return '#22c55e'; // Strong match - green
    if (score >= 6) return '#eab308'; // Moderate match - yellow
    if (score >= 4) return '#f97316'; // Fair match - orange
    return '#ef4444'; // Weak match - red
  };

  const getDormRates = (dorm) => {
    if (Array.isArray(dorm.rates)) {
      return dorm.rates.map(rate => ({
        type: rate.type,
        rate: rate.rate
      }));
    } else if (dorm.rates && typeof dorm.rates === 'object') {
      // If we have min/max rates, use the average for each room type
      const avgRate = Math.round((dorm.rates.min + dorm.rates.max) / 2);
      return dorm.roomTypes.map(type => ({
        type: type,
        rate: `$${avgRate.toLocaleString()}`
      }));
    }
    return [];
  };

  const filteredDorms = dorms.filter(dorm => {
    if (filters.location && dorm.location !== filters.location) return false;
    if (filters.roomType && !dorm.roomTypes.includes(filters.roomType)) return false;
    if (filters.budget) {
      const budget = parseFloat(filters.budget);
      let dormRates = [];
      
      if (Array.isArray(dorm.rates)) {
        dormRates = dorm.rates.map(rate => parseFloat(rate.rate.replace('$', '').replace(',', '')));
      } else if (dorm.rates && typeof dorm.rates === 'object') {
        dormRates = [dorm.rates.min, dorm.rates.max];
      }

      if (dormRates.length > 0 && Math.min(...dormRates) > budget) return false;
    }
    return true;
  }).map(dorm => ({
    ...dorm,
    matchScore: calculateMatchScore(dorm)
  })).sort((a, b) => b.matchScore - a.matchScore);

  const renderDormCard = (dorm) => {
    const googleData = googleReviews[dorm.name];
    console.log('Rendering card for:', dorm.name, 'Google data:', googleData);
    
    return (
      <div key={dorm.name} className={styles.dormCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <h3>{dorm.name}</h3>
            <div className={styles.matchScoreContainer}>
              <span className={styles.matchScoreLabel}>Match Score</span>
              <div 
                className={styles.matchScore}
                style={{ backgroundColor: getMatchColor(dorm.matchScore) }}
              >
                {dorm.matchScore}/10
              </div>
            </div>
          </div>
          <span className={styles.location}>{dorm.location}</span>
        </div>

        <div className={styles.cardContent}>
          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Room Types</span>
              <div className={styles.roomTypes}>
                {dorm.roomTypes.map((type, index) => (
                  <span key={index} className={styles.roomType}>
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Rates</span>
              <div className={styles.rates}>
                {getDormRates(dorm).map((rate, index) => (
                  <div key={index} className={styles.rate}>
                    <span className={styles.rateType}>{rate.type}:</span>
                    <span className={styles.rateValue}>{rate.rate}/semester</span>
                  </div>
                ))}
              </div>
            </div>

            {dorm.buildingInfo && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Building Info</span>
                <div className={styles.buildingInfo}>
                  <p>Year Built: {dorm.buildingInfo.yearBuilt}</p>
                </div>
              </div>
            )}

            {googleData && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Google Rating</span>
                <div className={styles.googleReview}>
                  <div className={styles.stars}>
                    {'★'.repeat(Math.floor(googleData.rating))}
                    {'☆'.repeat(5 - Math.floor(googleData.rating))}
                  </div>
                  <div className={styles.ratingInfo}>
                    <span className={styles.rating}>{googleData.rating.toFixed(1)}</span>
                    <span className={styles.reviewCount}>({googleData.reviews} reviews)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Finding your perfect dorm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>AggieRoomie - Find Your Perfect Dorm</title>
        <meta name="description" content="Find dorm halls at Texas A&M University" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <Link href="/search" className={styles.logo}>
            <span className={styles.logoText}>AggieRoomie</span>
          </Link>
          <Link href="/map" className={styles.mapButton}>
            <span className={styles.mapIcon}>🗺️</span>
            View Campus Map
          </Link>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Find Your Perfect Dorm</h1>
          <p className={styles.description}>
            Discover the ideal living space at Texas A&M University
          </p>
        </div>

        <div className={styles.filtersContainer}>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label htmlFor="location">Location</label>
              <select
                id="location"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className={styles.select}
              >
                <option value="">All Locations</option>
                <option value="North Campus">North Campus</option>
                <option value="South Campus">South Campus</option>
                <option value="East Campus">East Campus</option>
                <option value="West Campus">West Campus</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="roomType">Room Type</label>
              <select
                id="roomType"
                name="roomType"
                value={filters.roomType}
                onChange={handleFilterChange}
                className={styles.select}
              >
                <option value="">All Room Types</option>
                <option value="Double">Double</option>
                <option value="Single">Single</option>
                <option value="Suite">Suite</option>
                <option value="Single Suite">Single Suite</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="budget">Budget (per Semester)</label>
              <div className={styles.budgetInput}>
                <span className={styles.currency}>$</span>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={filters.budget}
                  onChange={handleFilterChange}
                  className={styles.input}
                  placeholder="Enter your budget"
                />
              </div>
            </div>
          </div>
          <div className={styles.searchButtonContainer}>
            <button onClick={handleSearch} className={styles.searchButton}>
              Find Dorms
            </button>
          </div>
        </div>

        {showResults && (
          <div className={styles.results}>
            <div className={styles.resultsHeader}>
              <h2>Available Dorms</h2>
              <span className={styles.resultCount}>{filteredDorms.length} results</span>
            </div>

            {filteredDorms.length === 0 ? (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>🔍</div>
                <p>No dorms found matching your criteria</p>
                <button 
                  onClick={() => setFilters({ location: '', roomType: '', budget: '' })}
                  className={styles.resetButton}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {filteredDorms.map((dorm) => renderDormCard(dorm))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>© 2025 AggieRoomie. Suraj Singh M</p>
      </footer>
    </div>
  );
} 