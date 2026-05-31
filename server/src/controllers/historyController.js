const Verification = require('../models/verification');

// @desc    Get all verifications for the logged-in user
// @route   GET /api/history
// @access  Private
exports.getHistory = async (req, res, next) => {
    try {
        const verifications = await Verification.find({ userId: req.user._id })
            .select('title trustScore claimsCount createdAt')
            .sort({ createdAt: -1 })
            .lean();

        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });

        res.status(200).json({
            success: true,
            count: verifications.length,
            data: verifications
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a single verification by ID (must belong to user)
// @route   GET /api/history/:id
// @access  Private
exports.getVerificationById = async (req, res, next) => {
    try {
        const verification = await Verification.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).lean();

        if (!verification) {
            return res.status(404).json({
                success: false,
                message: 'Verification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: verification
        });
    } catch (error) {
        next(error);
    }
};
