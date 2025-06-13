import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const dormsPath = path.join(process.cwd(), 'data', 'dorms.json');
    const dormsData = JSON.parse(fs.readFileSync(dormsPath, 'utf8'));
    
    // Extract the dorms array from the nested structure
    const dorms = Array.isArray(dormsData.dorms) ? dormsData.dorms : [];
    
    // Transform the rates array into min/max format
    const validDorms = dorms.map(dorm => {
      const rates = dorm.rates || [];
      const rateValues = rates.map(r => parseFloat(r.rate.replace(/[^0-9.-]+/g, '')));
      
      return {
        name: dorm.name || 'Unknown',
        location: dorm.location || 'Unknown',
        roomTypes: Array.isArray(dorm.roomTypes) ? dorm.roomTypes : [],
        rates: {
          min: rateValues.length > 0 ? Math.min(...rateValues) : 0,
          max: rateValues.length > 0 ? Math.max(...rateValues) : 0
        },
        amenities: Array.isArray(dorm.amenities) ? dorm.amenities : [],
        coordinates: dorm.coordinates || null,
        buildingInfo: dorm.buildingInfo || {},
        googleReview: dorm.googleReview || null
      };
    });

    res.status(200).json(validDorms);
  } catch (error) {
    console.error('Error reading dorms data:', error);
    res.status(500).json({ message: 'Error reading dorms data' });
  }
} 