import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const dormsPath = path.join(process.cwd(), 'data', 'dorms.json');
    const coordsPath = path.join(process.cwd(), 'data', 'dormcords.json');

    // Read dorm data
    const dormsData = JSON.parse(fs.readFileSync(dormsPath, 'utf8'));
    const coordsData = JSON.parse(fs.readFileSync(coordsPath, 'utf8'));

    // Merge dorm data with coordinates
    const dorms = dormsData.dorms.map(dorm => {
      const coordinates = coordsData[dorm.name];
      if (coordinates) {
        return {
          ...dorm,
          coordinates: {
            lat: coordinates.lat,
            lng: coordinates.lng
          }
        };
      }
      return dorm;
    });

    res.status(200).json(dorms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dorm data' });
  }
} 