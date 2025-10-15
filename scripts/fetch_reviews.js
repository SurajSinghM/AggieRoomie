#!/usr/bin/env node


import fs from 'fs';
import path from 'path';

function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnvLocal();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error('Missing Google Places API key. Set GOOGLE_PLACES_API_KEY or NEXT_PUBLIC_GOOGLE_PLACES_API_KEY in .env.local');
  process.exit(1);
}

const dormsPath = path.join(process.cwd(), 'data', 'dorms.json');
const outPath = path.join(process.cwd(), 'data', 'dorms_with_reviews.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function resolveFetch() {
  
  if (typeof fetch !== 'undefined') return fetch;

  
  const http = await import('node:http');
  const https = await import('node:https');
  return function simpleFetch(url, opts = {}) {
    return new Promise((resolve, reject) => {
      try {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, (res) => {
          const { statusCode } = res;
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            resolve({
              ok: statusCode >= 200 && statusCode < 300,
              status: statusCode,
              text: async () => body,
              json: async () => {
                try {
                  return JSON.parse(body);
                } catch (e) {
                  throw new Error('Invalid JSON response');
                }
              }
            });
          });
        });
        req.on('error', reject);
        
        req.setTimeout(20_000, () => { req.destroy(new Error('Request timeout')); });
      } catch (e) { reject(e); }
    });
  };
}

async function findPlaceId(query) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
  const _fetch = await resolveFetch();
  const res = await _fetch(url);
  if (!res.ok) throw new Error(`Textsearch request failed: ${res.status}`);
  const data = await res.json();
  if (data.results && data.results.length > 0) return data.results[0].place_id;
  return null;
}

async function getPlaceDetails(placeId) {
  const fields = 'name,rating,reviews,user_ratings_total';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;
  const _fetch = await resolveFetch();
  const res = await _fetch(url);
  if (!res.ok) throw new Error(`Details request failed: ${res.status}`);
  const data = await res.json();
  return data.result || null;
}

async function main() {
  console.log('Reading dorms from', dormsPath);
  const raw = fs.readFileSync(dormsPath, 'utf8');
  const parsed = JSON.parse(raw);
  const dorms = Array.isArray(parsed.dorms) ? parsed.dorms : parsed;

  const results = [];

  for (const dorm of dorms) {
    const name = dorm.name;
    console.log('\nProcessing:', name);

    
    const queries = [
      `${name} Texas A&M University`,
      `${name} dorm Texas A&M`,
      `${name} College Station TX`
    ];

    let placeId = null;
    for (const q of queries) {
      try {
        placeId = await findPlaceId(q);
        if (placeId) {
          console.log('Found placeId for', name, ':', placeId);
          break;
        }
      } catch (err) {
        console.warn('Textsearch error for', q, ':', err.message);
      }
      
      await sleep(200);
    }

    if (!placeId) {
      console.warn('No placeId found for', name, '— leaving googleReview as null');
      results.push({ ...dorm, googleReview: null });
      
      await sleep(300);
      continue;
    }

    try {
      
      await sleep(300);
      const details = await getPlaceDetails(placeId);
      if (!details) {
        console.warn('No details for placeId', placeId);
        results.push({ ...dorm, googleReview: null });
        continue;
      }

      const reviewData = {
        name: details.name || dorm.name,
        rating: details.rating || null,
        reviews: details.user_ratings_total || null,
        recentReviews: []
      };

      if (Array.isArray(details.reviews) && details.reviews.length > 0) {
        reviewData.recentReviews = details.reviews.slice(0, 3).map(r => ({
          author: r.author_name,
          rating: r.rating,
          text: r.text && r.text.length > 200 ? r.text.substring(0, 200) + '...' : r.text
        }));
      }

      results.push({ ...dorm, googleReview: reviewData });
      console.log('Saved review for', name, JSON.stringify(reviewData));
    } catch (err) {
      console.error('Error fetching details for', name, ':', err.message);
      results.push({ ...dorm, googleReview: null });
    }

    
    await sleep(500);
  }

  
  fs.writeFileSync(outPath, JSON.stringify({ dorms: results }, null, 2), 'utf8');
  console.log('\nWrote enriched dorm data to', outPath);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
