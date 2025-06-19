export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
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