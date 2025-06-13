const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const { Client } = require('@googlemaps/google-maps-services-js');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Validate environment variables
const requiredEnvVars = ['GOOGLE_MAPS_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

// Initialize Google Maps client with timeout
const googleMapsClient = new Client({
    timeout: 5000, // 5 second timeout
    config: {
        maxRetries: 3
    }
});

// Rate limiting
const searchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Cache for dorm data and reviews
let dormCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Dorm locations with coordinates
const dormLocations = {
    'Aston Hall': { lat: 30.6182, lng: -96.3375 },
    'Clements Hall': { lat: 30.6180, lng: -96.3370 },
    'Dunn Hall': { lat: 30.6185, lng: -96.3378 },
    'Fowler Hall': { lat: 30.6178, lng: -96.3368 },
    'Hart Hall': { lat: 30.6179, lng: -96.3369 },
    'Hobby Hall': { lat: 30.6177, lng: -96.3367 },
    'Hullabaloo Hall': { lat: 30.6188, lng: -96.3382 },
    'Krueger Hall': { lat: 30.6186, lng: -96.3380 },
    'Lechner Hall': { lat: 30.6175, lng: -96.3365 },
    'Mosher Hall': { lat: 30.6184, lng: -96.3376 },
    'Moses Hall': { lat: 30.6176, lng: -96.3366 },
    'Rudder Hall': { lat: 30.6174, lng: -96.3364 },
    'Underwood Hall': { lat: 30.6173, lng: -96.3363 }
};

async function getGoogleReviews(dormName) {
    try {
        console.log(`Searching for reviews for: ${dormName}`);
        
        // First, search for the place using Places API with more specific parameters
        const searchResponse = await googleMapsClient.textSearch({
            params: {
                query: `${dormName} Texas A&M`,
                key: process.env.GOOGLE_MAPS_API_KEY,
                location: '30.6280,-96.3344', // Texas A&M University coordinates
                radius: '2000' // 2km radius
            }
        });

        console.log('Search response:', JSON.stringify(searchResponse.data, null, 2));

        if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
            console.log(`No places found for ${dormName}`);
            return null;
        }

        // Get the first result's place_id
        const placeId = searchResponse.data.results[0].place_id;
        console.log(`Found place_id: ${placeId} for ${dormName}`);

        // Get place details including reviews
        const detailsResponse = await googleMapsClient.placeDetails({
            params: {
                place_id: placeId,
                key: process.env.GOOGLE_MAPS_API_KEY,
                fields: ['rating', 'user_ratings_total', 'reviews', 'name', 'formatted_address', 'types']
            }
        });

        console.log('Details response:', JSON.stringify(detailsResponse.data, null, 2));

        const placeDetails = detailsResponse.data.result;

        if (!placeDetails) {
            console.log(`No details found for ${dormName}`);
            return null;
        }

        // Verify the place name matches our dorm name
        const placeName = placeDetails.name.toLowerCase();
        const searchName = dormName.toLowerCase();
        
        console.log(`Comparing names: "${placeName}" vs "${searchName}"`);
        
        // More lenient name matching
        const nameMatch = placeName.includes(searchName) || 
                         searchName.includes(placeName) ||
                         placeName.includes('dorm') ||
                         placeName.includes('hall') ||
                         placeName.includes('residence');

        if (!nameMatch) {
            console.log(`Place name mismatch: ${placeName} vs ${searchName}`);
            return null;
        }

        // Ensure we have valid rating data
        if (!placeDetails.rating || !placeDetails.user_ratings_total) {
            console.log(`Missing rating data for ${dormName}`);
            return null;
        }

        const reviewData = {
            rating: parseFloat(placeDetails.rating),
            reviews: parseInt(placeDetails.user_ratings_total)
        };

        console.log(`Returning review data for ${dormName}:`, reviewData);
        return reviewData;
    } catch (error) {
        console.error(`Error fetching Google reviews for ${dormName}:`, error);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
        return null;
    }
}

async function loadDorms() {
    try {
        // Check cache first
        if (dormCache && lastCacheUpdate && (Date.now() - lastCacheUpdate < CACHE_DURATION)) {
            console.log('Returning cached dorm data');
            return dormCache;
        }

        console.log('Loading dorm data from file...');
        const data = await fs.readFile('data/dorms.json', 'utf8');
        const parsedData = JSON.parse(data);
        
        // Validate dorm data structure
        if (!parsedData.dorms || !Array.isArray(parsedData.dorms)) {
            throw new Error('Invalid dorm data structure');
        }

        console.log('Validating dorm data...');
        const dorms = parsedData.dorms.map(dorm => {
            // Validate required fields
            if (!dorm.name || !dorm.location || !dorm.roomTypes || !dorm.rates) {
                console.warn('Invalid dorm data:', dorm);
                return null;
            }

            // Ensure rates are properly formatted
            const validatedRates = dorm.rates.map(rate => {
                if (!rate.type || !rate.rate) {
                    console.warn('Invalid rate data:', rate);
                    return null;
                }
                return rate;
            }).filter(rate => rate !== null);

            // Ensure room types are properly formatted
            const validatedRoomTypes = dorm.roomTypes.filter(type => typeof type === 'string');

            // Ensure location is properly formatted
            const location = dorm.location.trim();

            console.log(`Processing dorm ${dorm.name}:`, {
                originalLocation: dorm.location,
                processedLocation: location,
                coordinates: dormLocations[dorm.name]
            });

            return {
                ...dorm,
                rates: validatedRates,
                roomTypes: validatedRoomTypes,
                location: location
            };
        }).filter(dorm => dorm !== null);

        console.log(`Successfully loaded ${dorms.length} dorms`);

        // Update cache
        dormCache = dorms;
        lastCacheUpdate = Date.now();
        
        return dorms;
    } catch (error) {
        console.error('Error loading dorms:', error);
        throw error;
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/map', async (req, res) => {
    try {
        const dorms = await loadDorms();
        res.render('map', { dorms });
    } catch (error) {
        console.error('Error loading map:', error);
        res.status(500).render('error', { message: 'Error loading map data' });
    }
});

app.post('/search', searchLimiter, async (req, res) => {
    try {
        const { roomType, maxBudget, location } = req.body;
        
        console.log('Search request received:', { roomType, maxBudget, location });
        
        // Input validation
        if (!roomType || !maxBudget || !location) {
            console.log('Missing required fields:', { roomType, maxBudget, location });
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: {
                    roomType: !roomType ? 'Room type is required' : null,
                    maxBudget: !maxBudget ? 'Budget is required' : null,
                    location: !location ? 'Location is required' : null
                }
            });
        }

        // Validate maxBudget is a positive number
        if (isNaN(maxBudget) || maxBudget <= 0) {
            console.log('Invalid budget:', maxBudget);
            return res.status(400).json({ 
                error: 'Invalid budget',
                details: 'Budget must be a positive number'
            });
        }

        // Load and validate dorms data
        const dorms = await loadDorms();
        console.log('Total dorms loaded:', dorms.length);
        
        if (!Array.isArray(dorms) || dorms.length === 0) {
            console.error('No dorms data available');
            return res.status(500).json({ 
                error: 'Unable to load dorm data',
                details: 'Please try again later'
            });
        }

        // Filter dorms based on criteria
        const filteredDorms = dorms
            .map(dorm => {
                // Get rates for the specific room type
                const matchedRates = dorm.rates.filter(rate => {
                    const rateType = rate.type.toLowerCase();
                    const searchType = roomType.toLowerCase();
                    
                    // Handle special cases
                    if (searchType.includes('2') || searchType.includes('two') || searchType === 'double') {
                        return rateType === 'double';
                    }
                    if (searchType.includes('1') || searchType.includes('one') || searchType === 'single') {
                        return rateType === 'single';
                    }
                    if (searchType === 'suite') {
                        return rateType === 'suite' || rateType === 'single suite';
                    }
                    return rateType === searchType;
                });

                // If no matching rates, return null
                if (matchedRates.length === 0) return null;

                // Calculate score based on multiple factors
                let score = 0;
                
                // Room type match (4 points max)
                const roomTypeScore = dorm.roomTypes.some(type => {
                    const normalizedType = type.toLowerCase();
                    const normalizedSearch = roomType.toLowerCase();
                    
                    if (normalizedSearch.includes('2') || normalizedSearch.includes('two') || normalizedSearch === 'double') {
                        return normalizedType === 'double';
                    }
                    if (normalizedSearch.includes('1') || normalizedSearch.includes('one') || normalizedSearch === 'single') {
                        return normalizedType === 'single';
                    }
                    if (normalizedSearch === 'suite') {
                        return normalizedType === 'suite' || normalizedType === 'single suite';
                    }
                    return normalizedType === normalizedSearch;
                }) ? 4 : 0;
                
                // Price score (3 points max)
                const lowestRate = Math.min(...matchedRates.map(rate => 
                    parseInt(rate.rate.replace(/[$,]/g, ''))
                ));
                const priceScore = 3 * (1 - (lowestRate / maxBudget));
                
                // Location score (1 point max)
                const locationScore = dorm.location.toLowerCase().trim() === location.toLowerCase().trim() ? 1 : 0;
                
                // Building quality score (1 point max)
                const yearBuilt = parseInt(dorm.buildingInfo.yearBuilt);
                const buildingScore = yearBuilt >= 2010 ? 1 : 0;

                // Google review score (2 points max)
                const reviewScore = dorm.googleReview ? (dorm.googleReview.rating / 5) * 2 : 0;
                
                // Total score (10 points max)
                score = roomTypeScore + priceScore + locationScore + buildingScore + reviewScore;

                console.log(`Dorm ${dorm.name} scored:`, {
                    roomTypeScore,
                    priceScore,
                    locationScore,
                    buildingScore,
                    reviewScore,
                    totalScore: score,
                    matchedRates
                });

                return {
                    ...dorm,
                    score,
                    scoreDetails: {
                        roomTypeScore,
                        priceScore,
                        locationScore,
                        buildingScore,
                        reviewScore
                    },
                    matchedRates
                };
            })
            .filter(dorm => dorm !== null) // Remove null entries
            .sort((a, b) => b.score - a.score); // Sort by score in descending order

        console.log(`Found ${filteredDorms.length} matching dorms`);

        if (filteredDorms.length === 0) {
            return res.json({ 
                dorms: [],
                message: `No dorms found matching your criteria. Try adjusting your room type, budget, or location.`
            });
        }

        const dormsWithReviews = await Promise.all(
            filteredDorms.map(async dorm => {
                try {
                    console.log(`Fetching reviews for ${dorm.name}`);
                    const reviews = await getGoogleReviews(dorm.name);
                    console.log(`Reviews for ${dorm.name}:`, reviews);
                    return {
                        ...dorm,
                        googleReview: reviews
                    };
                } catch (error) {
                    console.error(`Error fetching reviews for ${dorm.name}:`, error);
                    return {
                        ...dorm,
                        googleReview: null
                    };
                }
            })
        );

        res.json({ dorms: dormsWithReviews });
    } catch (error) {
        console.error('Error processing search:', error);
        res.status(500).json({ 
            error: 'An error occurred while processing your search',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
    });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

// Export the Express API
module.exports = app; 