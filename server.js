const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Load dorm data
let dorms = [];
async function loadDorms() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data', 'dorms.json'), 'utf8');
        dorms = JSON.parse(data).dorms;
        console.log('Dorm data loaded successfully');
    } catch (error) {
        console.error('Error loading dorm data:', error);
        process.exit(1);
    }
}

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/rank-dorms', (req, res) => {
    try {
        const { roomType, budget, location } = req.body;

        // Input validation
        if (!roomType || !budget || !location) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const budgetNum = parseInt(budget);
        if (isNaN(budgetNum) || budgetNum <= 0) {
            return res.status(400).json({ error: 'Invalid budget amount' });
        }

        // Filter dorms based on criteria
        const matchingDorms = dorms.filter(dorm => {
            return dorm.roomTypes.includes(roomType) &&
                   dorm.priceRange.max <= budgetNum &&
                   dorm.location === location;
        });

        if (matchingDorms.length === 0) {
            return res.json({ rankedDorms: [] });
        }

        // Rank dorms based on multiple factors
        const rankedDorms = matchingDorms.map(dorm => {
            let score = 0;

            // Rating score (40% weight)
            score += (dorm.rating / 5) * 40;

            // Price score (20% weight) - lower price is better
            const priceScore = 1 - ((dorm.priceRange.max - dorm.priceRange.min) / budgetNum);
            score += priceScore * 20;

            // Location score (15% weight) - closer to campus is better
            const locationScore = 1 - (dorm.distanceToCampus / 500); // 500m is max distance
            score += locationScore * 15;

            // Amenities score (15% weight)
            const amenitiesScore = dorm.amenities.length / 10; // Assuming max 10 amenities
            score += amenitiesScore * 15;

            // Year built score (10% weight) - newer is better
            const yearScore = (dorm.yearBuilt - 1990) / 30; // Assuming oldest dorm is from 1990
            score += yearScore * 10;

            return {
                ...dorm,
                score: Math.round(score * 100) / 100
            };
        });

        // Sort by score in descending order
        rankedDorms.sort((a, b) => b.score - a.score);

        // Return top 3 dorms
        res.json({ rankedDorms: rankedDorms.slice(0, 3) });

    } catch (error) {
        console.error('Error ranking dorms:', error);
        res.status(500).json({ error: 'An error occurred while ranking dorms' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
loadDorms().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}); 