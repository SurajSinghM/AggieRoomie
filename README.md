# AggieRoomie

A comprehensive dorm search and comparison tool for Texas A&M University students.

## Features

- **Smart Search**: Filter dorms by location, room type, and budget
- **Interactive Map**: Explore dorm locations on campus
- **Real Reviews**: Google Places integration for authentic reviews
- **Price Comparison**: Compare rates across different room types
- **Match Scoring**: AI-powered dorm recommendations

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

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```env
# Google Places API Key (for reviews)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Google Maps API Key (for map functionality)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Getting Google API Keys

1. **Google Places API Key** (for reviews):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Places API" and "Places API (New)"
   - Create credentials (API Key)
   - Add the key to your `.env.local` file

2. **Google Maps API Key** (for map functionality):
   - In the same Google Cloud Console project

## One-time populate Google Places reviews

If you want to fetch Google Places reviews once and store them in a local JSON file so the site doesn't call the API on every search, use the script in `scripts/fetch_reviews.js`.

1. Create a `.env.local` in the project root and add your key (server-side key is recommended):

```
GOOGLE_PLACES_API_KEY=YOUR_SERVER_SIDE_GOOGLE_PLACES_API_KEY
```

2. Run the script (from project root):

```
npm run populate-reviews
```

3. The script will write `data/dorms_with_reviews.json`. You can replace `data/dorms.json` with the new file or update your server route to serve the enriched file.

Notes:
- The script uses simple delays between requests to avoid quota spikes. For large-scale updates consider using backoff and monitoring quota usage in Google Cloud Console.
- Do not commit `.env.local` to source control.
   - Add the key to your `.env.local` file

### Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. **Home Page**: Landing page with feature overview
2. **Search Page**: Filter and search for dorms based on your preferences
3. **Map Page**: Interactive campus map showing dorm locations

## Technologies Used

- Next.js
- React
- Google Places API
- Google Maps API
- CSS Modules
- Modern JavaScript (ES6+)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Texas A&M University for providing dorm information
- Google Maps Platform for location services
- Next.js team for the amazing framework 