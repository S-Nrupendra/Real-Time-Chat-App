const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { createError } = require('./error.middleware');

const protect = async (req, res, next) => {
    try{
        let token,

        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
            token = req.headers.authorization.split(' ')[1];
        }
        if(!token){
            return next(createError('Not authorized, no token', 401));
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId).select('-password -resetPasswordToken -resetPasswordExpiry');

        if(!req.user){
            return next(createError('User no longer exists', 401));
        }
        next();
    } catch(error){
        next(createError('Not authorized, token failed', 401));
    }
};

module.exports = { protect };