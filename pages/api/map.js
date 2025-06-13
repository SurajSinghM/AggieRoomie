import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const dormsPath = path.join(process.cwd(), 'data', 'dorms.json');
    const coordsPath = path.join(process.cwd(), 'data', 'dormcords.json');
    
    const dormsData = JSON.parse(fs.readFileSync(dormsPath, 'utf8'));
    const coordsData = JSON.parse(fs.readFileSync(coordsPath, 'utf8'));

    // Merge dorm data with coordinates
    const dorms = dormsData.map(dorm => ({
      ...dorm,
      coordinates: coordsData[dorm.name] || null
    }));

    res.status(200).json(dorms);
  } catch (error) {
    console.error('Error reading map data:', error);
    res.status(500).json({ message: 'Error reading map data' });
  }
} 