export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // If placeId is provided, fetch details for a specific place
  if (req.query.placeId) {
    const placeId = req.query.placeId;
    if (!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
      return res.status(500).json({ message: 'Google Places API key not configured' });
    }
    try {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,formatted_phone_number,website,opening_hours,plus_code,types,photos&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      if (!detailsData.result) {
        return res.status(404).json({ message: 'Place details not found' });
      }
      res.status(200).json(detailsData.result);
      return;
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch place details', error: error.message });
      return;
    }
  }

  const { dormName } = req.query;
  if (!dormName) {
    return res.status(400).json({ message: 'Dorm name is required' });
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
    console.log('API Key missing:', process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY);
    return res.status(500).json({ message: 'Google Places API key not configured' });
  }

  try {
    console.log('Fetching reviews for:', dormName);
    
    // Search for the dorm
    const searchQueries = [
      `${dormName} Texas A&M University`,
      `${dormName} dorm Texas A&M`,
      `${dormName} College Station TX`
    ];

    let placeId = null;
    let placeName = '';

    for (const query of searchQueries) {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.results && searchData.results.length > 0) {
        const result = searchData.results[0];
        
        // Check if this is a relevant result (university, lodging, etc.)
        const relevantTypes = ['university', 'lodging', 'establishment', 'point_of_interest'];
        const isRelevant = result.types.some(type => relevantTypes.includes(type));
        
        if (isRelevant) {
          placeId = result.place_id;
          placeName = result.name;
          console.log('Found place:', placeName, 'with ID:', placeId);
          break;
        }
      }
    }

    if (!placeId) {
      console.log('No place found for:', dormName);
      return res.status(404).json({ message: 'No relevant place found' });
    }

    // Get detailed information including reviews
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (!detailsData.result) {
      console.log('No details found for place ID:', placeId);
      return res.status(404).json({ message: 'Place details not found' });
    }

    const place = detailsData.result;
    const reviewData = {
      name: place.name,
      rating: place.rating || 0,
      reviews: place.user_ratings_total || 0,
      recentReviews: []
    };

    // Extract recent reviews if available
    if (place.reviews && place.reviews.length > 0) {
      reviewData.recentReviews = place.reviews.slice(0, 3).map(review => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text.substring(0, 200) + (review.text.length > 200 ? '...' : '')
      }));
    }

    console.log('Returning review data:', reviewData);
    res.status(200).json(reviewData);
  } catch (error) {
    console.error('Error in Google Places API:', error);
    res.status(500).json({ message: 'Failed to fetch place data' });
  }
}

// New handler for apartment search
export async function apartmentsHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { near, radius } = req.query;
  const searchLocation = near || 'Texas A&M University, College Station, TX';
  const searchRadius = radius || 3000; // in meters

  if (!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY) {
    return res.status(500).json({ message: 'Google Places API key not configured' });
  }

  try {
    // Get coordinates for the search location (campus)
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchLocation)}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    if (!geocodeData.results || geocodeData.results.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }
    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Run multiple textsearch queries for broader apartment coverage
    const searchKeywords = [
      'apartments', 'student apartments', 'student housing', 'condos', 'lofts', 'residence', 'college apartments', 'university apartments', 'housing', 'Aspire', 'City Heights at College Station'
    ];
    let allPlaces = [];
    for (const keyword of searchKeywords) {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword + ' near ' + searchLocation)}&location=${lat},${lng}&radius=${searchRadius}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        allPlaces = allPlaces.concat(data.results);
      }
    }
    // Deduplicate by place_id
    const seen = new Set();
    let places = allPlaces.filter(place => {
      if (seen.has(place.place_id)) return false;
      seen.add(place.place_id);
      return true;
    });
    // Limit to 20 places for Distance Matrix API
    places = places.slice(0, 20);
    if (places.length === 0) {
      return res.status(404).json({ message: 'No apartments found' });
    }

    // Prepare destinations for Distance Matrix
    const destinations = places.map(place => `${place.geometry.location.lat},${place.geometry.location.lng}`).join('|');
    const origin = `${lat},${lng}`;
    // Get distances for drive, bike, walk
    let driveRes, bikeRes, walkRes;
    try {
      [driveRes, bikeRes, walkRes] = await Promise.all([
        fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destinations}&mode=driving&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`),
        fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destinations}&mode=bicycling&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`),
        fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destinations}&mode=walking&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`)
      ]);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch distance data from Google API', error: err.message });
    }
    let driveData, bikeData, walkData;
    try {
      [driveData, bikeData, walkData] = await Promise.all([
        driveRes.json(),
        bikeRes.json(),
        walkRes.json()
      ]);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to parse distance data from Google API', error: err.message });
    }

    // Apartment filtering logic
    const apartmentTypes = [
      'apartment', 'real_estate_agency', 'premise', 'point_of_interest', 'establishment'
    ];
    const excludedTypes = [
      'lodging', 'hotel', 'motel', 'inn', 'hostel', 'guest_house', 'bed_and_breakfast'
    ];
    const apartmentKeywords = [
      'apartment', 'apartments', 'student', 'housing', 'lofts', 'condo', 'residence', 'college', 'university', 'heights', 'aspire', 'city heights'
    ];
    const apartments = places
      .filter(place => {
        // Exclude hotels, motels, inns, and similar lodging
        if (place.types.some(type => excludedTypes.includes(type))) return false;
        // Must have an apartment-related type or keyword in the name
        const nameLower = place.name.toLowerCase();
        const hasType = place.types.some(type => apartmentTypes.includes(type));
        const hasKeyword = apartmentKeywords.some(kw => nameLower.includes(kw));
        return hasType || hasKeyword;
      })
      .map((place, i) => ({
        name: place.name,
        address: place.formatted_address || place.vicinity,
        rating: place.rating || null,
        userRatingsTotal: place.user_ratings_total || null,
        placeId: place.place_id,
        location: place.geometry.location,
        icon: place.icon,
        types: place.types,
        photoUrl: place.photos && place.photos.length > 0
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`
          : null,
        distance: {
          drive: driveData.rows[0].elements[i].status === 'OK' ? driveData.rows[0].elements[i] : null,
          bike: bikeData.rows[0].elements[i].status === 'OK' ? bikeData.rows[0].elements[i] : null,
          walk: walkData.rows[0].elements[i].status === 'OK' ? walkData.rows[0].elements[i] : null
        }
      }));

    res.status(200).json({ apartments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch apartments', error: error.message });
  }
} 