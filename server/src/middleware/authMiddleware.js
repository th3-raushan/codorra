const jwt= require('jsonwebtoken');
const User= require('../models/users');

const protect= async (req, res, next)=>{
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try{
            // Extract token from "Bearer <token>"
            token= req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded= jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to request (excluding password)
            req.user= await User.findById(decoded.id).select('-password');

            if(!req.user){
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized, user no longer exists'
                });
            }

            return next();
        } catch(error){
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token is invalid or expired'
            });
        }
    }

    // No Authorization header or doesn't start with Bearer
    return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
    });
};

module.exports= {protect};