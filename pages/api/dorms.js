import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // Read dorm data from JSON file
    const dormsPath = path.join(process.cwd(), 'data', 'dorms.json');
    const dormsData = JSON.parse(fs.readFileSync(dormsPath, 'utf8'));

    // Read coordinates from JSON file
    const coordsPath = path.join(process.cwd(), 'data', 'dormcords.json');
    const coordsData = JSON.parse(fs.readFileSync(coordsPath, 'utf8'));

    // Merge dorm data with coordinates
    const dorms = dormsData.map(dorm => ({
      ...dorm,
      coordinates: coordsData[dorm.name] || null
    }));

    res.status(200).json(dorms);
  } catch (error) {
    console.error('Error loading dorm data:', error);
    res.status(500).json({ error: 'Failed to load dorm data' });
  }
} 