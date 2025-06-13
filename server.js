const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const { Client } = require('@googlemaps/google-maps-services-js');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize Google Maps client with timeout
const googleMapsClient = new Client({
    timeout: 5000, // 5 second timeout
    config: {
        maxRetries: 3
    }
});

const app = express();
const port = process.env.PORT || 3000;

// Validate environment variables
const requiredEnvVars = ['GOOGLE_MAPS_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

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

// Dorm locations with verified coordinates (updated with more precise values)
const dormLocations = {
    'Appelt Hall': { lat: 30.6170, lng: -96.3360 },
    'Aston Hall': { lat: 30.6182, lng: -96.3375 },
    'Clements Hall': { lat: 30.6180, lng: -96.3370 },
    'Dunn Hall': { lat: 30.6185, lng: -96.3378 },
    'Eppright Hall': { lat: 30.6169, lng: -96.3359 },
    'Fowler Hall': { lat: 30.6178, lng: -96.3368 },
    'Haas Hall': { lat: 30.6172, lng: -96.3362 },
    'Hart Hall': { lat: 30.6179, lng: -96.3369 },
    'Hobby Hall': { lat: 30.6177, lng: -96.3367 },
    'Hullabaloo Hall': { lat: 30.6188, lng: -96.3382 },
    'Krueger Hall': { lat: 30.6186, lng: -96.3380 },
    'Lechner Hall': { lat: 30.6175, lng: -96.3365 },
    'McFadden Hall': { lat: 30.6171, lng: -96.3361 },
    'Mosher Hall': { lat: 30.6184, lng: -96.3376 },
    'Moses Hall': { lat: 30.6176, lng: -96.3366 },
    'Neeley Hall': { lat: 30.6183, lng: -96.3377 },
    'Rudder Hall': { lat: 30.6174, lng: -96.3364 },
    'Underwood Hall': { lat: 30.6173, lng: -96.3363 },
    'Walton Hall': { lat: 30.6181, lng: -96.3374 },
    'Wells Hall': { lat: 30.6168, lng: -96.3358 }  // Added Wells Hall
};

async function getGoogleReviews(dormName) {
    try {
        console.log(`\n=== Starting review search for ${dormName} ===`);
        
        // Special case handling for specific halls
        const specialCases = {
            'Hullabaloo Hall': ['Hullabaloo Hall', 'Hullabaloo', 'Hullabaloo Dorm', 'Hullabaloo Residence Hall'],
            'Hobby Hall': ['Hobby Hall', 'Hobby Dorm', 'Hobby Residence Hall'],
            'Moses Hall': ['Moses Hall', 'Moses Dorm', 'Moses Residence Hall'],
            'Mosher Hall': ['Mosher Hall', 'Mosher Dorm', 'Mosher Residence Hall']
        };

        // Get search queries based on whether it's a special case
        let searchQueries = specialCases[dormName] || [
            `${dormName} Hall Texas A&M`,
            `${dormName} Hall`,
            `${dormName} Texas A&M`,
            dormName
        ];

        // Add common variations
        if (dormName.includes('Hall')) {
            const baseName = dormName.replace(' Hall', '');
            searchQueries = [
                ...searchQueries,
                `${baseName} Dorm Texas A&M`,
                `${baseName} Residence Hall Texas A&M`,
                `${baseName} Dorm`,
                `${baseName} Residence Hall`
            ];
        }

        console.log('Search queries to try:', searchQueries);

        let searchResponse = null;
        let usedQuery = '';

        // Try each query until we get results
        for (const query of searchQueries) {
            console.log(`\nTrying search query: "${query}"`);
            try {
                searchResponse = await googleMapsClient.textSearch({
                    params: {
                        query: query,
                        key: process.env.GOOGLE_MAPS_API_KEY,
                        location: '30.6280,-96.3344', // Texas A&M University coordinates
                        radius: '5000' // 5km radius
                    }
                });

                if (searchResponse.data.results && searchResponse.data.results.length > 0) {
                    usedQuery = query;
                    console.log(`Found results with query: "${query}"`);
                    break;
                }
            } catch (error) {
                console.log(`Query "${query}" failed:`, error.message);
                continue;
            }
        }

        if (!searchResponse || !searchResponse.data.results || searchResponse.data.results.length === 0) {
            console.log(`No places found for ${dormName} with any query`);
            return null;
        }

        // Log all results for debugging
        console.log('\nSearch Results:');
        searchResponse.data.results.forEach((result, index) => {
            console.log(`\nResult ${index + 1}:`);
            console.log(`Name: ${result.name}`);
            console.log(`Place ID: ${result.place_id}`);
            console.log(`Types: ${result.types.join(', ')}`);
        });

        // Get the first result's place_id
        const placeId = searchResponse.data.results[0].place_id;
        console.log(`\nSelected place_id: ${placeId} for ${dormName}`);

        // Get place details including reviews
        const detailsResponse = await googleMapsClient.placeDetails({
            params: {
                place_id: placeId,
                key: process.env.GOOGLE_MAPS_API_KEY,
                fields: ['rating', 'user_ratings_total', 'reviews', 'name', 'formatted_address', 'types']
            }
        });

        console.log('\nPlace Details:');
        console.log(JSON.stringify(detailsResponse.data.result, null, 2));

        const placeDetails = detailsResponse.data.result;

        if (!placeDetails) {
            console.log(`No details found for ${dormName}`);
            return null;
        }

        // More lenient name matching
        const placeName = placeDetails.name.toLowerCase();
        const searchName = dormName.toLowerCase();
        
        console.log(`\nName Comparison:`);
        console.log(`Place name: "${placeName}"`);
        console.log(`Search name: "${searchName}"`);
        
        // Check if either name contains the other or if they share significant words
        const placeWords = placeName.split(/\s+/);
        const searchWords = searchName.split(/\s+/);
        const hasCommonWords = placeWords.some(word => searchWords.includes(word)) ||
                             searchWords.some(word => placeWords.includes(word));
        
        console.log(`Common words found: ${hasCommonWords}`);
        
        // Special case for Hullabaloo
        const isHullabaloo = searchName.includes('hullabaloo') || placeName.includes('hullabaloo');
        
        if (!placeName.includes(searchName) && !searchName.includes(placeName) && !hasCommonWords && !isHullabaloo) {
            console.log(`Place name mismatch: ${placeName} vs ${searchName}`);
            return null;
        }

        // Return review data even if some fields are missing
        const reviewData = {
            rating: placeDetails.rating ? parseFloat(placeDetails.rating) : 0,
            reviews: placeDetails.user_ratings_total ? parseInt(placeDetails.user_ratings_total) : 0,
            placeName: placeDetails.name, // Include the actual place name for verification
            address: placeDetails.formatted_address
        };

        console.log(`\nFinal review data for ${dormName}:`, reviewData);
        return reviewData;
    } catch (error) {
        console.error(`\nError fetching Google reviews for ${dormName}:`, error);
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

            // Get coordinates for the dorm
            const coordinates = dormLocations[dorm.name];
            if (!coordinates) {
                console.warn(`No coordinates found for ${dorm.name}`);
            }

            console.log(`Processing dorm ${dorm.name}:`, {
                originalLocation: dorm.location,
                processedLocation: location,
                coordinates: coordinates
            });

            return {
                ...dorm,
                rates: validatedRates,
                roomTypes: validatedRoomTypes,
                location: location,
                coordinates: coordinates || { lat: 30.6280, lng: -96.3344 } // Default to TAMU center if no coordinates found
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

// Function to get dorm location from Google Places API
async function getDormLocation(dormName) {
    try {
        console.log(`\n=== Fetching location for ${dormName} ===`);
        
        // Try different search queries in order of specificity
        const searchQueries = [
            `${dormName} Texas A&M University College Station TX 77843`,
            `${dormName} Residence Hall Texas A&M University`,
            `${dormName} Dormitory Texas A&M University`,
            `${dormName} Hall Texas A&M University`,
            `${dormName} Texas A&M University`
        ];

        let searchResponse = null;
        let bestResult = null;
        let bestScore = 0;

        // Try each query until we get results
        for (const query of searchQueries) {
            console.log(`Trying search query: "${query}"`);
            try {
                searchResponse = await googleMapsClient.textSearch({
                    params: {
                        query: query,
                        key: process.env.GOOGLE_MAPS_API_KEY,
                        location: '30.6280,-96.3344', // Texas A&M University coordinates
                        radius: '2000' // 2km radius to be more precise
                    }
                });

                if (searchResponse.data.results && searchResponse.data.results.length > 0) {
                    // Score each result based on name match and location
                    for (const result of searchResponse.data.results) {
                        let score = 0;
                        const resultName = result.name.toLowerCase();
                        const searchName = dormName.toLowerCase();

                        // Score based on name match
                        if (resultName.includes(searchName)) score += 3;
                        if (searchName.includes(resultName)) score += 2;
                        if (resultName.includes('hall') || resultName.includes('dorm')) score += 1;
                        if (resultName.includes('texas a&m')) score += 1;

                        // Score based on location (closer to TAMU center is better)
                        const resultLat = result.geometry.location.lat;
                        const resultLng = result.geometry.location.lng;
                        const distanceFromCenter = Math.sqrt(
                            Math.pow(resultLat - 30.6280, 2) + 
                            Math.pow(resultLng - (-96.3344), 2)
                        );
                        if (distanceFromCenter < 0.01) score += 2; // Within ~1km
                        else if (distanceFromCenter < 0.02) score += 1; // Within ~2km

                        console.log(`Result "${result.name}" scored: ${score}`);
                        
                        if (score > bestScore) {
                            bestScore = score;
                            bestResult = result;
                        }
                    }

                    if (bestScore >= 3) { // Only use results with good scores
                        console.log(`Found good match with score ${bestScore}: "${bestResult.name}"`);
                        break;
                    }
                }
            } catch (error) {
                console.log(`Query "${query}" failed:`, error.message);
                continue;
            }
        }

        if (!bestResult) {
            console.log(`No good matches found for ${dormName}`);
            return null;
        }

        // Get place details including geometry
        const detailsResponse = await googleMapsClient.placeDetails({
            params: {
                place_id: bestResult.place_id,
                key: process.env.GOOGLE_MAPS_API_KEY,
                fields: ['geometry', 'name', 'formatted_address']
            }
        });

        const placeDetails = detailsResponse.data.result;
        if (!placeDetails || !placeDetails.geometry || !placeDetails.geometry.location) {
            console.log(`No location data found for ${dormName}`);
            return null;
        }

        const location = {
            lat: placeDetails.geometry.location.lat,
            lng: placeDetails.geometry.location.lng
        };

        // Validate location is within reasonable bounds of TAMU
        const isWithinBounds = 
            location.lat >= 30.61 && location.lat <= 30.64 && 
            location.lng >= -96.34 && location.lng <= -96.33;

        if (!isWithinBounds) {
            console.log(`Location for ${dormName} is outside TAMU bounds:`, location);
            return null;
        }

        console.log(`Valid location for ${dormName}:`, location);
        return location;
    } catch (error) {
        console.error(`Error fetching location for ${dormName}:`, error);
        return null;
    }
}

// Function to verify dorm locations with more precise search
async function verifyDormLocation(dormName, coordinates) {
    try {
        console.log(`\n=== Verifying location for ${dormName} ===`);
        
        // Search queries specific to Texas A&M dorms
        const searchQueries = [
            `${dormName} Hall Texas A&M University College Station TX 77843`,
            `${dormName} Residence Hall Texas A&M University`,
            `${dormName} Hall TAMU`,
            `${dormName} Hall College Station TX`
        ];

        let bestResult = null;
        let bestScore = 0;

        for (const query of searchQueries) {
            console.log(`Trying search query: ${query}`);
            const searchResponse = await googleMapsClient.textSearch({
                params: {
                    query: query,
                    key: process.env.GOOGLE_MAPS_API_KEY,
                    location: '30.6180,-96.3370', // Center of campus
                    radius: '1000' // 1km radius for more precise results
                }
            });

            if (searchResponse.data.results && searchResponse.data.results.length > 0) {
                for (const result of searchResponse.data.results) {
                    // Score the result based on various factors
                    let score = 0;
                    
                    // Check if the name matches
                    if (result.name.toLowerCase().includes(dormName.toLowerCase())) {
                        score += 3;
                    }
                    
                    // Check if it's on campus
                    const resultLat = result.geometry.location.lat;
                    const resultLng = result.geometry.location.lng;
                    const distanceFromCampus = Math.sqrt(
                        Math.pow(resultLat - 30.6180, 2) +
                        Math.pow(resultLng - (-96.3370), 2)
                    );
                    
                    if (distanceFromCampus < 0.01) { // Within ~1km of campus center
                        score += 2;
                    }
                    
                    // Check for keywords in the address
                    const address = result.formatted_address.toLowerCase();
                    if (address.includes('texas a&m') || address.includes('tamu')) {
                        score += 2;
                    }
                    if (address.includes('college station')) {
                        score += 1;
                    }
                    
                    // Check if it's a building (not a parking lot, etc.)
                    if (result.types.includes('establishment')) {
                        score += 1;
                    }
                    
                    console.log(`Result score for ${result.name}: ${score}`);
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestResult = result;
                    }
                }
            }
        }

        if (bestResult && bestScore >= 4) { // Minimum score threshold
            const newCoordinates = {
                lat: bestResult.geometry.location.lat,
                lng: bestResult.geometry.location.lng
            };
            
            console.log(`Found better location for ${dormName}:`, {
                address: bestResult.formatted_address,
                score: bestScore,
                coordinates: newCoordinates
            });
            
            return newCoordinates;
        }

        console.log(`No better location found for ${dormName}, keeping current coordinates`);
        return coordinates;
    } catch (error) {
        console.error(`Error verifying location for ${dormName}:`, error);
        return coordinates;
    }
}

// Update dorm locations with verified coordinates
async function updateDormLocations() {
    try {
        console.log('Updating dorm locations...');
        const dorms = await loadDorms();
        
        for (const dorm of dorms) {
            const currentLocation = dormLocations[dorm.name];
            if (currentLocation) {
                // Verify the current location
                const verifiedLocation = await verifyDormLocation(dorm.name, currentLocation);
                if (verifiedLocation) {
                    dormLocations[dorm.name] = verifiedLocation;
                    console.log(`Updated verified location for ${dorm.name}:`, verifiedLocation);
                }
            } else {
                // Try to find a new location
                console.log(`Fetching new location for ${dorm.name}`);
                const location = await getDormLocation(dorm.name);
                if (location) {
                    dormLocations[dorm.name] = location;
                    console.log(`Updated location for ${dorm.name}:`, location);
                }
            }
        }
        
        console.log('Dorm locations updated successfully');
    } catch (error) {
        console.error('Error updating dorm locations:', error);
    }
}

// Update locations when server starts
updateDormLocations();

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
        
        // Add coordinates to each dorm
        const dormsWithCoordinates = dorms.map(dorm => ({
            ...dorm,
            coordinates: dormLocations[dorm.name] || null
        }));

        console.log('Sending dorms to map view:', dormsWithCoordinates.map(d => ({
            name: d.name,
            coordinates: d.coordinates
        })));

        res.render('map', { 
            dorms: dormsWithCoordinates,
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
        });
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