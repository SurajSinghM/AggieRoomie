# AggieRoomie

AggieRoomie is a web application that helps Texas A&M students find and compare dorm halls. Built with Next.js and the Google Maps API.

## Features

- Interactive campus map showing dorm locations
- Detailed dorm information including room types, rates, and amenities
- Search and filter dorms by location, room type, and price
- Compare up to 3 dorms side by side
- Google Maps integration for accurate locations and reviews

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn
- Google Maps API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/AggieRoomie.git
cd AggieRoomie
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your Google Maps API key:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

The application is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and it will automatically deploy your application.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Texas A&M University for providing dorm information
- Google Maps Platform for location services
- Next.js team for the amazing framework 