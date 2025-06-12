const mongoose = require('mongoose');
const Dorm = require('../models/Dorm');
require('dotenv').config();

const dorms = [
    {
        name: "Hullabaloo Hall",
        roomTypes: ["Single", "Double"],
        priceRange: { min: 5000, max: 7000 },
        location: "North Campus",
        amenities: ["Dining Hall", "Study Rooms", "Laundry", "Computer Lab", "Fitness Center"],
        rating: 4.5,
        totalRatings: 150,
        distanceToCampus: 100,
        yearBuilt: 2012,
        capacity: 1200,
        gender: "Co-ed",
        mealPlanRequired: true,
        description: "Modern residence hall with premium amenities and a vibrant community."
    },
    {
        name: "Moses Hall",
        roomTypes: ["Single", "Double", "Suite"],
        priceRange: { min: 4500, max: 6500 },
        location: "South Campus",
        amenities: ["Kitchen", "Study Rooms", "Laundry"],
        rating: 4.3,
        totalRatings: 120,
        distanceToCampus: 300,
        yearBuilt: 2008,
        capacity: 800,
        gender: "Co-ed",
        mealPlanRequired: false,
        description: "Comfortable living with suite-style options and kitchen facilities."
    },
    {
        name: "Lechner Hall",
        roomTypes: ["Double", "Suite"],
        priceRange: { min: 4000, max: 6000 },
        location: "North Campus",
        amenities: ["Dining Hall", "Study Rooms", "Laundry"],
        rating: 4.2,
        totalRatings: 100,
        distanceToCampus: 200,
        yearBuilt: 2005,
        capacity: 600,
        gender: "Co-ed",
        mealPlanRequired: true,
        description: "Traditional residence hall with a strong community atmosphere."
    },
    {
        name: "Dunn Hall",
        roomTypes: ["Single", "Double"],
        priceRange: { min: 3800, max: 5500 },
        location: "South Campus",
        amenities: ["Study Rooms", "Laundry", "Computer Lab"],
        rating: 4.0,
        totalRatings: 90,
        distanceToCampus: 400,
        yearBuilt: 2000,
        capacity: 500,
        gender: "Co-ed",
        mealPlanRequired: false,
        description: "Affordable housing option with essential amenities."
    },
    {
        name: "Aston Hall",
        roomTypes: ["Single", "Double", "Suite"],
        priceRange: { min: 4200, max: 6200 },
        location: "East Campus",
        amenities: ["Dining Hall", "Study Rooms", "Laundry", "Fitness Center"],
        rating: 4.4,
        totalRatings: 110,
        distanceToCampus: 250,
        yearBuilt: 2007,
        capacity: 700,
        gender: "Co-ed",
        mealPlanRequired: true,
        description: "Modern facilities with a focus on academic success."
    },
    {
        name: "Krueger Hall",
        roomTypes: ["Double", "Suite"],
        priceRange: { min: 3900, max: 5800 },
        location: "West Campus",
        amenities: ["Study Rooms", "Laundry", "Computer Lab"],
        rating: 4.1,
        totalRatings: 85,
        distanceToCampus: 350,
        yearBuilt: 2003,
        capacity: 550,
        gender: "Co-ed",
        mealPlanRequired: false,
        description: "Comfortable living with a focus on community engagement."
    },
    {
        name: "Neeley Hall",
        roomTypes: ["Single", "Double"],
        priceRange: { min: 4100, max: 6100 },
        location: "North Campus",
        amenities: ["Dining Hall", "Study Rooms", "Laundry", "Fitness Center"],
        rating: 4.3,
        totalRatings: 95,
        distanceToCampus: 150,
        yearBuilt: 2006,
        capacity: 650,
        gender: "Co-ed",
        mealPlanRequired: true,
        description: "Premium residence hall with extensive amenities."
    },
    {
        name: "Schuhmacher Hall",
        roomTypes: ["Double", "Suite"],
        priceRange: { min: 3700, max: 5400 },
        location: "South Campus",
        amenities: ["Study Rooms", "Laundry"],
        rating: 3.9,
        totalRatings: 80,
        distanceToCampus: 450,
        yearBuilt: 1998,
        capacity: 480,
        gender: "Co-ed",
        mealPlanRequired: false,
        description: "Traditional residence hall with essential amenities."
    }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aggieroomie', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    try {
        await Dorm.deleteMany({});
        await Dorm.insertMany(dorms);
        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
})
.catch(error => {
    console.error('Error connecting to database:', error);
    process.exit(1);
}); 