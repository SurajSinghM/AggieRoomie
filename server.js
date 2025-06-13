const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Client } = require('@googlemaps/google-maps-services-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Google Maps client
const googleMapsClient = new Client({});

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Dorm location coordinates
const dormLocations = {
    'Aston Hall': { lat: 30.6182, lng: -96.3375 },
    'Clements Hall': { lat: 30.6180, lng: -96.3370 },
    'Dunn Hall': { lat: 30.6185, lng: -96.3378 },
    'Fowler Hall': { lat: 30.6178, lng: -96.3368 },
    'Hart Hall': { lat: 30.6175, lng: -96.3365 },
    'Hobby Hall': { lat: 30.6172, lng: -96.3362 },
    'Hullabaloo Hall': { lat: 30.61716253293003, lng: 30.61716253293003 },
    'Krueger Hall': { lat: 30.6186, lng: -96.3380 },
    'Lechner Hall': { lat: 30.6170, lng: -96.3360 },
    'Mosher Hall': { lat: 30.6184, lng: -96.3376 },
    'Moses Hall': { lat: 30.6176, lng: -96.3366 },
    'Rudder Hall': { lat: 30.6174, lng: -96.3364 }
};

async function getGoogleReviews(dormName) {
    try {
        const response = await googleMapsClient.textSearch({
            params: {
                query: `${dormName} Texas A&M University College Station`,
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        });

        if (response.data.results && response.data.results.length > 0) {
            const place = response.data.results[0];
            return {
                rating: place.rating,
                reviews: place.user_ratings_total
            };
        }
        return null;
    } catch (error) {
        console.error(`Error fetching reviews for ${dormName}:`, error);
        return null;
    }
}

function loadDorms() {
    try {
        const data = JSON.parse(fs.readFileSync('data/dorms.json', 'utf8'));
        return data.dorms;
    } catch (error) {
        console.error('Error loading dorms:', error);
        return [];
    }
}

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/search', async (req, res) => {
    try {
        const { roomType, maxBudget, location } = req.body;
        
        if (!roomType || !maxBudget || !location) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const dorms = loadDorms();
        const filteredDorms = dorms.filter(dorm => {
            // Location matching
            const locationMatch = !location || dorm.location.toLowerCase().includes(location.toLowerCase());
            
            // Room type matching
            const roomTypeMatch = dorm.roomTypes.some(type => 
                type.toLowerCase().includes(roomType.toLowerCase())
            );

            return locationMatch && roomTypeMatch;
        });

        // Get Google Reviews for each dorm
        const dormsWithReviews = await Promise.all(filteredDorms.map(async dorm => {
            const reviews = await getGoogleReviews(dorm.name);
            return {
                ...dorm,
                googleReview: reviews
            };
        }));

        // Calculate scores and filter by budget
        const scoredDorms = dormsWithReviews
            .map(dorm => {
                const matchedRates = dorm.rates.filter(rate => {
                    const rateValue = parseInt(rate.rate.replace(/[^0-9]/g, ''));
                    return rateValue <= maxBudget;
                });

                if (matchedRates.length === 0) return null;

                // Calculate score based on room type match and price
                let score = 0;
                
                // Room type score (2 points max)
                const roomTypeScore = dorm.roomTypes.some(type => 
                    type.toLowerCase() === roomType.toLowerCase()
                ) ? 2 : 1;
                
                // Price score (2 points max)
                const lowestRate = Math.min(...matchedRates.map(rate => 
                    parseInt(rate.rate.replace(/[^0-9]/g, ''))
                ));
                const priceScore = 2 * (1 - (lowestRate / maxBudget));
                
                // Location score (1 point)
                const locationScore = dorm.location.toLowerCase() === location.toLowerCase() ? 1 : 0;
                
                // Total score (5 points max)
                score = roomTypeScore + priceScore + locationScore;

                return {
                    ...dorm,
                    score,
                    matchedRates
                };
            })
            .filter(dorm => dorm !== null)
            .sort((a, b) => b.score - a.score);

        res.json({ dorms: scoredDorms });
    } catch (error) {
        console.error('Error processing search:', error);
        res.status(500).json({ error: 'An error occurred while processing your search' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 