const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    originalContent: {
        type: String,
        required: true
    },
    trustScore: {
        type: Number,
        default: 0
    },
    claimsCount: {
        type: Number,
        default: 0
    },
    apiResponse: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Verification', verificationSchema);
