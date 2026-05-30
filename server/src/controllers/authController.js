const User= require('../models/users');
const jwt= require('jsonwebtoken');

const generateToken= (id)=>{
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '30d'});
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser= async (req, res, next)=>{
    const {name, email, password}= req.body;

    // --- Input validation ---
    if(!name || !email || !password){
        return res.status(400).json({
            success: false,
            message: 'Please provide name, email and password'
        });
    }

    if(password.length < 6){
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters'
        });
    }

    try{
        // Check if user already exists
        const userExists= await User.findOne({email: email.toLowerCase()});
        if(userExists){
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Create user (password hashing handled by model pre-save hook)
        const user= await User.create({name, email, password});

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id)
            }
        });
    } catch(error){
        next(error);
    }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser= async (req, res, next)=>{
    const {email, password}= req.body;

    // --- Input validation ---
    if(!email || !password){
        return res.status(400).json({
            success: false,
            message: 'Please provide email and password'
        });
    }

    try{
        const user= await User.findOne({email: email.toLowerCase()});

        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const isMatch= await user.matchPassword(password);

        if(!isMatch){
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id)
            }
        });
    } catch(error){
        next(error);
    }
};

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
exports.getUserProfile= async (req, res, next)=>{
    try{
        const user= await User.findById(req.user._id).select('-password');

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch(error){
        next(error);
    }
};
