import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Search.module.css';
import { dorms } from '../data/dorms';
import { locations } from '../data/locations';
import { roomTypes } from '../data/roomTypes';

export default function Search() {
  const router = useRouter();
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    location: '',
    roomType: '',
    budget: ''
  });
  const [searchCriteria, setSearchCriteria] = useState({
    location: '',
    roomType: '',
    budget: ''
  });
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [googleReviews, setGoogleReviews] = useState({});
  const [expandedReviews, setExpandedReviews] = useState({});
  const [reviewsFetched, setReviewsFetched] = useState(true); 

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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDorms();
  }, []);

  
  
  useEffect(() => {
    if (dorms && dorms.length > 0) {
      const map = {};
      dorms.forEach(d => {
        if (d.googleReview) map[d.name] = d.googleReview;
      });
      setGoogleReviews(map);
      setReviewsFetched(true);
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
    
    setSearchCriteria(filters);
    setShowResults(true);
    setLoadingReviews(true);
    
    
    if (reviewsFetched) {
      setTimeout(() => {
        setLoadingReviews(false);
      }, 1000);
    }
  };

  const calculateMatchScore = (dorm) => {
    let score = 0;
    const maxScore = 10; 

    
    let userPreferenceScore = 0;
    
    
    if (searchCriteria.location) {
      if (dorm.location === searchCriteria.location) {
        userPreferenceScore += 1.5; 
      } else {
        
        const locationGroups = {
          'North Campus': ['North Campus'],
          'South Campus': ['South Campus'],
          'East Campus': ['East Campus'],
          'West Campus': ['West Campus']
        };
        const preferredGroup = locationGroups[searchCriteria.location];
        if (preferredGroup && preferredGroup.includes(dorm.location)) {
          userPreferenceScore += 1.0;
        }
      }
    } else {
      userPreferenceScore += 1.5; 
    }

    
    if (searchCriteria.roomType) {
      if (dorm.roomTypes.includes(searchCriteria.roomType)) {
        userPreferenceScore += 1.5; 
      } else {
        
        const roomTypeSimilarity = {
          'Single': ['Single', 'Suite'],
          'Double': ['Double', 'Suite'],
          'Suite': ['Suite', 'Single', 'Double']
        };
        const similarTypes = roomTypeSimilarity[searchCriteria.roomType] || [];
        if (dorm.roomTypes.some(type => similarTypes.includes(type))) {
          userPreferenceScore += 0.8;
        }
      }
    } else {
      userPreferenceScore += 1.5; 
    }

    
    if (searchCriteria.budget) {
      const budget = parseFloat(searchCriteria.budget);
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
        const budgetPercentage = (avgRate / budget) * 100;

        if (maxRate <= budget) {
          userPreferenceScore += 1.0; 
        } else if (avgRate <= budget) {
          userPreferenceScore += 0.8; 
        } else if (minRate <= budget) {
          userPreferenceScore += 0.6; 
        } else if (budgetPercentage <= 130) {
          userPreferenceScore += 0.3; 
        } else if (budgetPercentage <= 150) {
          userPreferenceScore += 0.1; 
        }
      }
    } else {
      userPreferenceScore += 1.0; 
    }

    
    let qualityScore = 0;
    
  
  
  const googleData = dorm.googleReview || googleReviews[dorm.name];
    if (googleData && googleData.rating) {
      const rating = googleData.rating;
      const reviewCount = googleData.reviews || 0;
      
      
      if (rating >= 4.0) {
        qualityScore += 2.0;
      } else if (rating >= 3.5) {
        qualityScore += 1.6;
      } else if (rating >= 3.0) {
        qualityScore += 1.2;
      } else if (rating >= 2.5) {
        qualityScore += 0.8;
      } else if (rating >= 2.0) {
        qualityScore += 0.4;
      }

      
      if (reviewCount >= 20) {
        qualityScore += 1.0;
      } else if (reviewCount >= 10) {
        qualityScore += 0.6;
      } else if (reviewCount >= 5) {
        qualityScore += 0.2;
      }
    } else {
      
      qualityScore += 0.7;
    }

    
    if (dorm.buildingInfo && dorm.buildingInfo.yearBuilt) {
      const yearBuilt = parseInt(dorm.buildingInfo.yearBuilt);
      const currentYear = new Date().getFullYear();
      const age = currentYear - yearBuilt;

      if (age <= 5) {
        qualityScore += 1.0; 
      } else if (age <= 15) {
        qualityScore += 0.8; 
      } else if (age <= 25) {
        qualityScore += 0.6; 
      } else if (age <= 35) {
        qualityScore += 0.4; 
      } else {
        qualityScore += 0.2; 
      }
    } else {
      qualityScore += 0.5; 
    }

    
    const roomTypeCount = dorm.roomTypes.length;
    if (roomTypeCount >= 3) {
      qualityScore += 0.5; 
    } else if (roomTypeCount === 2) {
      qualityScore += 0.3; 
    } else {
      qualityScore += 0.1; 
    }

    
    let valueScore = 0;
    
    
    if (Array.isArray(dorm.rates) && dorm.rates.length > 0) {
      const allRates = dorm.rates.map(rate => parseFloat(rate.rate.replace('$', '').replace(',', '')));
      const avgRate = allRates.reduce((sum, rate) => sum + rate, 0) / allRates.length;
      
      
      if (avgRate <= 3000) {
        valueScore += 1.5; 
      } else if (avgRate <= 3500) {
        valueScore += 1.2; 
      } else if (avgRate <= 4000) {
        valueScore += 0.9; 
      } else if (avgRate <= 4500) {
        valueScore += 0.6; 
      } else if (avgRate <= 5000) {
        valueScore += 0.3; 
      } else {
        valueScore += 0.1; 
      }
    } else {
      valueScore += 0.7; 
    }

    
    let featureScore = 0;
    
    
    const prestigiousLocations = ['North Campus', 'South Campus'];
    if (prestigiousLocations.includes(dorm.location)) {
      featureScore += 0.5;
    } else {
      featureScore += 0.2; 
    }

    
    const premiumRoomTypes = ['Suite', 'Single'];
    if (dorm.roomTypes.some(type => premiumRoomTypes.includes(type))) {
      featureScore += 0.5;
    } else {
      featureScore += 0.2; 
    }

    
    const finalScore = userPreferenceScore + qualityScore + valueScore + featureScore;

    return Math.min(Math.round(finalScore * 10) / 10, maxScore); 
  };

  const getMatchColor = (score) => {
    if (score >= 8) return '#16a34a'; 
    if (score >= 6) return '#f59e0b'; 
    if (score >= 4) return '#ef4444'; 
    return '#6b7280'; 
  };

  const getDormRates = (dorm) => {
    if (Array.isArray(dorm.rates)) {
      return dorm.rates.map(rate => ({
        type: rate.type,
        rate: rate.rate
      }));
    } else if (dorm.rates && typeof dorm.rates === 'object') {
      
      return [
        {
          type: 'Range',
          rate: `$${dorm.rates.min.toLocaleString()} - $${dorm.rates.max.toLocaleString()}`
        }
      ];
    }
    return [];
  };

  
  const filteredDorms = showResults ? dorms
    .filter(dorm => {
      
      if (searchCriteria.roomType && !dorm.roomTypes.includes(searchCriteria.roomType)) {
        return false;
      }
      
      
      if (searchCriteria.location && dorm.location !== searchCriteria.location) {
        return false;
      }
      
      
      if (searchCriteria.budget) {
        const budget = parseFloat(searchCriteria.budget);
        let dormRates = [];
        
        if (Array.isArray(dorm.rates)) {
          dormRates = dorm.rates.map(rate => parseFloat(rate.rate.replace('$', '').replace(',', '')));
        } else if (dorm.rates && typeof dorm.rates === 'object') {
          dormRates = [dorm.rates.min, dorm.rates.max];
        }
        
        if (dormRates.length > 0) {
          const minRate = Math.min(...dormRates);
          if (minRate > budget) {
            return false; 
          }
        }
      }
      
      return true; 
    })
    .map(dorm => ({
      ...dorm,
      matchScore: calculateMatchScore(dorm)
    }))
    .sort((a, b) => b.matchScore - a.matchScore) : [];

  const renderDormCard = (dorm) => {
  const googleData = dorm.googleReview || googleReviews[dorm.name];
    const isExpanded = expandedReviews[dorm.name] || false;
    
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
        </div>

        <div className={styles.cardContent}>
          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Location</span>
              <div className={styles.locationInfo}>
                <span className={styles.locationText}>{dorm.location}</span>
              </div>
            </div>

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
                <div className={styles.reviewsSection}>
                  <div className={styles.reviewsHeader}>
                    <span className={styles.detailLabel}>Google Reviews</span>
                    <div className={styles.googleRatingBottom}>
                      <div className={styles.starsBottom}>
                    {'★'.repeat(Math.floor(googleData.rating))}
                    {'☆'.repeat(5 - Math.floor(googleData.rating))}
                  </div>
                      <span className={styles.ratingBottom}>{googleData.rating.toFixed(1)}</span>
                      <span className={styles.reviewCountBottom}>({googleData.reviews})</span>
                    </div>
                  </div>
                  <button 
                    className={styles.showReviewsButton}
                    onClick={() => toggleReviews(dorm.name)}
                  >
                    {isExpanded ? 'Hide Reviews' : 'Show Reviews'}
                  </button>
                </div>
                
                {isExpanded && googleData.recentReviews && googleData.recentReviews.length > 0 && (
                  <div className={styles.recentReviews}>
                    {googleData.recentReviews.map((review, index) => (
                      <div key={index} className={styles.reviewItem}>
                        <div className={styles.reviewMeta}>
                          <span className={styles.reviewAuthor}>{review.author}</span>
                          <span className={styles.reviewStars}>
                            {'★'.repeat(review.rating)}
                            {'☆'.repeat(5 - review.rating)}
                          </span>
                        </div>
                        <p className={styles.reviewText}>{review.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  
  const toggleReviews = (dormName) => {
    setExpandedReviews(prev => ({
      ...prev,
      [dormName]: !prev[dormName]
    }));
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
        <div className={styles.loadingSpinner} style={{ width: 48, height: 48, border: '6px solid #eee', borderTop: '6px solid #800000', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }}></div>
        <div style={{ color: '#b3b3b3', fontWeight: 600, fontSize: 18 }}>Finding your perfect dorm...</div>
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
        
        {}
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
        <div className={styles.hero}>
          <h1 className={styles.title}>Find Your Perfect Dorm</h1>
          <p className={styles.description}>
            Discover the ideal living space at Texas A&M University with our comprehensive dorm search and comparison tools
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
            <button 
              onClick={handleSearch} 
              className={styles.searchButton}
              disabled={loadingReviews}
            >
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

            {loadingReviews && (
              <div className={styles.reviewsLoadingContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
                <div className={styles.reviewsLoadingSpinner} style={{ width: 40, height: 40, border: '3px solid #eee', borderTop: '3px solid #800000', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }}></div>
                <div style={{ color: '#b3b3b3', fontWeight: 600, fontSize: 18 }}>Searching for dorms...</div>
              </div>
            )}

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
            ) : !loadingReviews ? (
              <div className={styles.grid}>
                {filteredDorms.map((dorm) => renderDormCard(dorm))}
              </div>
            ) : null}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>© 2025 AggieRoomie. Suraj Singh M</p>
      </footer>
    </div>
  );
} 