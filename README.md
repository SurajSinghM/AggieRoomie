# AggieRoomie

A comprehensive dorm search and comparison tool for Texas A&M University students.

## Features

- **Smart Search**: Filter dorms by location (North Campus, South Campus, South Campus - Commons), room type, and budget
- **Interactive Campus Map**: Explore dorm locations on campus with detailed popups
- **Apartment Search**: Find off-campus apartments near Texas A&M with distance information
- **Real Reviews**: Authentic Google reviews stored locally (works without API key)
- **Price Comparison**: Compare rates across different room types ($2,500 - $7,400/sem)
- **Match Scoring**: AI-powered dorm recommendations with bonuses for prestigious halls
- **Detailed Information**: Building info, room types, bathroom styles (Community, Suite, Private)

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AggieRoomie
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional):
The application works completely without API keys! Reviews are stored locally in JSON files.

If you want to fetch new reviews or add apartments, create a `.env.local` file in the root directory:

```env
# Google Places API Key (optional - only needed for fetching new reviews/apartments)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

**Note:** 
- Maps functionality uses Leaflet with OpenStreetMap, which is completely free and doesn't require any API keys!
- Reviews and apartment data are stored in `data/dorms_with_reviews.json` and `data/apartments.json` - the app works perfectly without the Google API once data is populated

### Getting Google Places API Key (Optional)

If you want to use Google Places API for reviews:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Places API" and "Places API (New)"
4. Create credentials (API Key)
5. Add the key to your `.env.local` file

## Data Population (Optional)

The application comes with pre-populated data, but if you want to update reviews or add new apartments:

### Populate Dorm Reviews

Use the script in `scripts/fetch_reviews.js` to fetch Google Places reviews and store them locally:

1. Create a `.env.local` in the project root:
```
GOOGLE_PLACES_API_KEY=YOUR_SERVER_SIDE_GOOGLE_PLACES_API_KEY
```

2. Run the script:
```bash
npm run populate-reviews
```

3. The script writes to `data/dorms_with_reviews.json` with reviews, ratings, and building information.

### Populate Apartments

Use `scripts/fetch_apartments.js` to fetch apartment data near Texas A&M:

1. Ensure your `.env.local` has the Google Places API key
2. Run the script (check the script for exact command)
3. The script writes to `data/apartments.json` with apartment details, reviews, and distance information

**Note:** Once data is populated, the application works completely without the Google API key!

### Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. **Home Page**: Landing page with feature overview, stats (20+ dorms, 100+ students helped, average dorm rating), and quick access to all features
2. **Search Page**: Filter and search for dorms based on location, room type, and budget. View match scores and detailed information
3. **Campus Map**: Interactive map showing dorm locations. Click markers to see details, then "More Details" for a full information panel
4. **Apartment Search**: Find off-campus apartments near Texas A&M with ratings, distance, and contact information

## Technologies Used

- **Next.js** - React framework for production
- **React** - UI library
- **Leaflet & OpenStreetMap** - Free, open-source mapping (no API key required)
- **CSS Modules** - Scoped styling
- **Modern JavaScript (ES6+)** - Latest language features

### Data Sources

- Dorm data stored in `data/dorms_with_reviews.json` (includes reviews, ratings, building info)
- Apartment data stored in `data/apartments.json` (includes reviews, ratings, distance info)
- Coordinates from `data/dormcords.json`
- Google Places API (optional) - Only needed for initial data population

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.


Not Affiliated with Texas A&M

