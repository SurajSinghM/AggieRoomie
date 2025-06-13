require('dotenv').config();
const { Client } = require('@googlemaps/google-maps-services-js');
const fs = require('fs').promises;
const path = require('path');

// Initialize Google Maps client
const googleMapsClient = new Client({
    timeout: 5000,
    config: {
        maxRetries: 3
    }
});

// List of dorms to update
const dormsToUpdate = [
    "Clements Hall",
    "Keathley Hall"
];

// Known correct coordinates for reference
const knownCoordinates = {
    "Hullabaloo Hall": { lat: 30.61695940399832, lng: -96.34624744540113 },
    "Haas Hall": { lat: 30.616182, lng: -96.344179 },
    "McFadden Hall": { lat: 30.615679, lng: -96.343950 }
};

async function getDormLocation(dormName) {
    try {
        console.log(`\nSearching for ${dormName}...`);
        
        // Special case handling for specific halls
        const specialCases = {
            'Clements Hall': [
                'Clements Hall Texas A&M University',
                'Clements Hall College Station TX',
                'Clements Hall Residence Hall Texas A&M',
                'Clements Hall Dormitory Texas A&M'
            ],
            'Keathley Hall': [
                'Keathley Hall Texas A&M University',
                'Keathley Hall College Station TX',
                'Keathley Hall Residence Hall Texas A&M',
                'Keathley Hall Dormitory Texas A&M'
            ]
        };

        // Get search queries based on whether it's a special case
        let searchQueries = specialCases[dormName] || [
            `${dormName} Texas A&M University`,
            `${dormName} College Station TX`,
            `${dormName} Residence Hall Texas A&M`,
            dormName
        ];

        let bestResult = null;
        let bestScore = 0;

        for (const query of searchQueries) {
            try {
                console.log(`Trying query: "${query}"`);
                const response = await googleMapsClient.textSearch({
                    params: {
                        query: query,
                        key: process.env.GOOGLE_MAPS_API_KEY,
                        location: '30.6280,-96.3344', // Texas A&M University coordinates
                        radius: '5000' // 5km radius
                    }
                });

                if (response.data.results && response.data.results.length > 0) {
                    // Score each result
                    for (const result of response.data.results) {
                        let score = 0;
                        
                        // Check name similarity
                        const resultName = result.name.toLowerCase();
                        const dormNameLower = dormName.toLowerCase();
                        if (resultName.includes(dormNameLower) || dormNameLower.includes(resultName)) {
                            score += 3;
                        }
                        
                        // Check if it's a university building
                        if (result.types.includes('university')) {
                            score += 2;
                        }
                        
                        // Check if it's a point of interest
                        if (result.types.includes('point_of_interest')) {
                            score += 1;
                        }
                        
                        // Check if it's in College Station
                        if (result.formatted_address && result.formatted_address.includes('College Station')) {
                            score += 2;
                        }

                        // Check if it's close to known coordinates
                        if (knownCoordinates[dormName]) {
                            const knownLat = knownCoordinates[dormName].lat;
                            const knownLng = knownCoordinates[dormName].lng;
                            const resultLat = result.geometry.location.lat;
                            const resultLng = result.geometry.location.lng;
                            
                            // Calculate distance (rough approximation)
                            const latDiff = Math.abs(knownLat - resultLat);
                            const lngDiff = Math.abs(knownLng - resultLng);
                            if (latDiff < 0.001 && lngDiff < 0.001) {
                                score += 3;
                            }
                        }

                        console.log(`Result "${result.name}" scored: ${score}`);
                        console.log('Location:', result.geometry.location);
                        console.log('Address:', result.formatted_address);
                        console.log('Types:', result.types);

                        if (score > bestScore) {
                            bestScore = score;
                            bestResult = result;
                        }
                    }
                }
            } catch (error) {
                console.error(`Error with query "${query}":`, error.message);
                continue;
            }
        }

        if (bestResult) {
            console.log(`\nBest match for ${dormName}:`);
            console.log('Name:', bestResult.name);
            console.log('Location:', bestResult.geometry.location);
            console.log('Address:', bestResult.formatted_address);
            console.log('Score:', bestScore);
            return bestResult.geometry.location;
        }

        console.log(`No location found for ${dormName}`);
        return null;
    } catch (error) {
        console.error(`Error getting location for ${dormName}:`, error);
        return null;
    }
}

async function main() {
    try {
        // Read existing coordinates
        const existingData = await fs.readFile('data/dormcords.json', 'utf8');
        const coordinates = JSON.parse(existingData);

        // Process each dorm
        for (const dormName of dormsToUpdate) {
            const location = await getDormLocation(dormName);
            if (location) {
                coordinates[dormName] = location;
                // Save after each successful update
                await fs.writeFile('data/dormcords.json', JSON.stringify(coordinates, null, 2));
                console.log(`Updated coordinates for ${dormName}`);
            }
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\nFinal coordinates saved to data/dormcords.json');
    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 