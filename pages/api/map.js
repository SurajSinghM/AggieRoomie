import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Read dorm data and coordinates from dormcords.json
    const enrichedPath = path.join(process.cwd(), 'data', 'dorms_with_reviews.json');
    const defaultPath = path.join(process.cwd(), 'data', 'dorms.json');
    const dormsPath = fs.existsSync(enrichedPath) ? enrichedPath : defaultPath;
    const coordsPath = path.join(process.cwd(), 'data', 'dormcords.json');

    const dormsData = JSON.parse(fs.readFileSync(dormsPath, 'utf8'));
    const coordsData = JSON.parse(fs.readFileSync(coordsPath, 'utf8'));

    const dormsList = Array.isArray(dormsData.dorms) ? dormsData.dorms : [];

    // Always use coordinates from dormcords.json as the primary source
    const dorms = dormsList.map(dorm => {
      const coords = coordsData[dorm.name];
      
      // Prioritize coordinates from dormcords.json
      if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
        return {
          ...dorm,
          coordinates: {
            lat: coords.lat,
            lng: coords.lng
          }
        };
      }

      // Fallback to coordinates in dorm data if dormcords.json doesn't have it
      if (dorm.coordinates && typeof dorm.coordinates.lat === 'number' && typeof dorm.coordinates.lng === 'number') {
        return dorm;
      }

      // No coordinates available - return dorm without coordinates
      return {
        ...dorm,
        coordinates: null
      };
    });

    res.status(200).json(dorms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dorm data' });
  }
} 