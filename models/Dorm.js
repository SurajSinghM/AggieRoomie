const mongoose = require('mongoose');

const dormSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    roomTypes: [{
        type: String,
        enum: ['Single', 'Double', 'Suite', 'Apartment']
    }],
    priceRange: {
        min: Number,
        max: Number
    },
    location: {
        type: String,
        required: true
    },
    amenities: [String],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    distanceToCampus: {
        type: Number, // in meters
        required: true
    },
    yearBuilt: Number,
    capacity: Number,
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Co-ed']
    },
    mealPlanRequired: {
        type: Boolean,
        default: false
    },
    parkingAvailable: {
        type: Boolean,
        default: true
    },
    airConditioning: {
        type: Boolean,
        default: true
    },
    laundryFacilities: {
        type: Boolean,
        default: true
    },
    studyRooms: {
        type: Boolean,
        default: true
    },
    computerLab: {
        type: Boolean,
        default: false
    },
    fitnessCenter: {
        type: Boolean,
        default: false
    },
    images: [String],
    description: String
});

module.exports = mongoose.model('Dorm', dormSchema); 