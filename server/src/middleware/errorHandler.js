// Global error handler middleware
// Catches errors forwarded via next(error) from controllers

const errorHandler= (err, req, res, next)=>{
    console.error('Global Error Handler:', err.message);

    // Mongoose validation error (e.g., invalid email format, missing required fields)
    if(err.name === 'ValidationError'){
        const messages= Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            message: messages.join('. ')
        });
    }

    // Mongoose duplicate key error (e.g., email already exists)
    if(err.code === 11000){
        const field= Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            message: `An account with this ${field} already exists`
        });
    }

    // Mongoose bad ObjectId (CastError)
    if(err.name === 'CastError'){
        return res.status(400).json({
            success: false,
            message: 'Resource not found (invalid ID format)'
        });
    }

    // JWT errors
    if(err.name === 'JsonWebTokenError'){
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if(err.name === 'TokenExpiredError'){
        return res.status(401).json({
            success: false,
            message: 'Token has expired'
        });
    }

    // Default server error
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
};

module.exports= errorHandler;
