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

const outPath = path.join(process.cwd(), 'data', 'apartments.json');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }


async function resolveFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  const http = await import('node:http');
  const https = await import('node:https');
  return function simpleFetch(url) {
    return new Promise((resolve, reject) => {
      try {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, (res) => {
          const { statusCode } = res;
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            resolve({ ok: statusCode >= 200 && statusCode < 300, status: statusCode, text: async () => body, json: async () => JSON.parse(body) });
          });
        });
        req.on('error', reject);
        req.setTimeout(20000, () => req.destroy(new Error('Request timeout')));
      } catch (e) { reject(e); }
    });
  };
}

async function textSearch(query, location, radius) {
  const url = location && radius
    ? `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=${radius}&key=${API_KEY}`
    : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
  const _fetch = await resolveFetch();
  const res = await _fetch(url);
  if (!res.ok) throw new Error(`Textsearch failed: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

async function geocode(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
  const _fetch = await resolveFetch();
  const res = await _fetch(url);
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  return data.results[0].geometry.location;
}

async function getPlaceDetails(placeId) {
  
  const fields = 'name,formatted_address,geometry,rating,user_ratings_total,types,photos,place_id,formatted_phone_number,website,reviews,opening_hours';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;
  const _fetch = await resolveFetch();
  const res = await _fetch(url);
  if (!res.ok) throw new Error(`Details failed: ${res.status}`);
  const data = await res.json();
  return data.result || null;
}

async function main() {
  console.log('Starting apartment fetch...');

  const searchLocation = 'Texas A&M University, College Station, TX';
  const searchRadius = 4828; 

  console.log('Geocoding search location:', searchLocation);
  const loc = await geocode(searchLocation);
  if (!loc) {
    console.error('Could not geocode search location');
    process.exit(1);
  }
  const locationStr = `${loc.lat},${loc.lng}`;

  const keywords = ['apartments', 'student apartments', 'student housing', 'condos', 'lofts', 'residence', 'college apartments', 'university apartments', 'housing'];
  let allPlaces = [];
  for (const kw of keywords) {
    console.log('Searching for:', kw);
    try {
      const results = await textSearch(`${kw} near ${searchLocation}`, locationStr, searchRadius);
      if (results.length) allPlaces = allPlaces.concat(results);
    } catch (e) {
      console.warn('Textsearch error for', kw, e.message);
    }
    await sleep(200);
  }

  
  const seen = new Set();
  const places = allPlaces.filter(p => {
    if (seen.has(p.place_id)) return false;
    seen.add(p.place_id);
    return true;
  }).slice(0, 50); 

  console.log('Found', places.length, 'unique places');

  const apartments = [];
  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    console.log(`Processing (${i+1}/${places.length}):`, place.name);
    try {
      await sleep(300 + (i % 5) * 100);
      const details = await getPlaceDetails(place.place_id);
      if (!details) {
        console.warn('No details for', place.place_id);
        continue;
      }

      const photoUrl = details.photos && details.photos.length > 0
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${details.photos[0].photo_reference}&key=${API_KEY}`
        : null;

      
      let recentReviews = [];
      if (Array.isArray(details.reviews) && details.reviews.length > 0) {
        recentReviews = details.reviews.slice(0, 3).map(r => ({
          author: r.author_name || r.author || 'Anonymous',
          rating: r.rating || null,
          text: r.text || ''
        }));
      }

      apartments.push({
        name: details.name || place.name,
        address: details.formatted_address || place.formatted_address || place.vicinity || null,
        phone: details.formatted_phone_number || null,
        website: details.website || null,
        rating: details.rating || null,
        userRatingsTotal: details.user_ratings_total || null,
        googleReview: {
          rating: details.rating || null,
          reviews: details.user_ratings_total || null,
          recentReviews
        },
        placeId: details.place_id || place.place_id,
        location: details.geometry && details.geometry.location ? details.geometry.location : (place.geometry && place.geometry.location ? place.geometry.location : null),
        types: details.types || place.types || [],
        photoUrl
      });
    } catch (e) {
      console.error('Error processing place', place.place_id, e.message);
    }
  }

  fs.writeFileSync(outPath, JSON.stringify({ apartments }, null, 2), 'utf8');
  console.log('Wrote apartments to', outPath);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
