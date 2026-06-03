const Joi = require('joi');
const { schema } = require('../models/User.model');

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required().message({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required'
    }),
    username: Joi.string().alphanum().min(3).max(20).required().message({
        'string.alphanum': 'Username can only contain letters and numbers',
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username cannot exceed 20 characters',
        'any.required': 'Username is required'
    }),
    email: Joi.string().email().required().message({
        'string.email': 'Please provide a valid email',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().message({
        'string.min': 'Password must be atleast 6 characters',
        'any.required': 'Password is required'
    })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().message({
        'string.email': 'Please provide a valid email',
        'any.required': 'Email is required'
    }),
    password: Joi.string().required().message({
        'any.required': 'Password is required'
    })
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required().message({
        'string.email': 'Please provide a valid email',
        'any.required': 'Email is required'
    })
});

const resetPasswordSchema = Joi.object({
    password: Joi.string().min(6).required().message({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    })
});

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if(error){
        const message = error.details.map(d => d.message);
        return res.status(400).json({ message: 'Validation failed', errors: message });
    }
    next();
};

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema
};