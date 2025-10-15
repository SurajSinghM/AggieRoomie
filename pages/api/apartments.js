import { apartmentsHandler } from './google-places';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
	
	try {
		const filePath = path.join(process.cwd(), 'data', 'apartments.json');
		if (fs.existsSync(filePath)) {
			const raw = fs.readFileSync(filePath, 'utf8');
			const parsed = JSON.parse(raw);
			
			if (parsed && Array.isArray(parsed.apartments)) {
				return res.status(200).json({ apartments: parsed.apartments });
			}
			return res.status(200).json(parsed);
		}
	} catch (e) {
		
		console.warn('Failed to read local apartments.json, falling back to live API:', e && e.message);
	}

	
	return apartmentsHandler(req, res);
}