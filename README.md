# AggieRoomie

A web application to help Texas A&M students find and compare dorm halls.

## Features

- Interactive campus map with dorm locations
- Detailed information about each dorm hall
- Room type and rate comparisons
- Google Maps integration for accurate locations

## Tech Stack

- Next.js
- React
- Google Maps API
- CSS Modules

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/AggieRoomie.git
cd AggieRoomie
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Google Maps API key:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/pages` - Next.js pages and API routes
- `/styles` - CSS modules and global styles
- `/data` - JSON data files for dorms and coordinates
- `/public` - Static assets

## Deployment

The application is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and it will automatically deploy your changes.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 