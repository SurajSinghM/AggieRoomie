import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
  
  const enrichedPath = path.join(process.cwd(), 'data', 'dorms_with_reviews.json');
  const defaultPath = path.join(process.cwd(), 'data', 'dorms.json');
  const dormsPath = fs.existsSync(enrichedPath) ? enrichedPath : defaultPath;
  const dormsData = JSON.parse(fs.readFileSync(dormsPath, 'utf8'));
    
    
    const dorms = Array.isArray(dormsData.dorms) ? dormsData.dorms : [];
    
    
    const validDorms = dorms.map(dorm => {
      return {
        name: dorm.name || 'Unknown',
        location: dorm.location || 'Unknown',
        roomTypes: Array.isArray(dorm.roomTypes) ? dorm.roomTypes : [],
        rates: Array.isArray(dorm.rates) ? dorm.rates : [],
        amenities: Array.isArray(dorm.amenities) ? dorm.amenities : [],
        coordinates: dorm.coordinates || null,
        buildingInfo: dorm.buildingInfo || {},
        googleReview: dorm.googleReview || null
      };
    });

    res.status(200).json(validDorms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dorm data' });
  }
} 