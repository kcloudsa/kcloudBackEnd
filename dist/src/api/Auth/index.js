"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthAPI = void 0;
// Load environment variables first
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_jwt_1 = require("passport-jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const userServices_1 = require("../../services/userServices");
const userModel_1 = __importDefault(require("../../models/userModel"));
const tokenUtils_1 = require("../../Utils/tokenUtils");
const router = express_1.default.Router();
// Custom JWT extractor that checks Authorization header
const jwtExtractor = (req) => {
    let token = null;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
    }
    return token;
};
// Passport Local Strategy for credentials login
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: 'email',
    passwordField: 'password',
}, async (email, password, done) => {
    try {
        const user = (await (0, userServices_1.getUserByEmail)(email));
        if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        if (user && user.password?.hashed) {
            const storedPassword = user.password.hashed;
            // First try bcrypt comparison (for properly hashed passwords)
            try {
                const isPasswordValid = await bcryptjs_1.default.compare(password, storedPassword);
                if (isPasswordValid) {
                    return done(null, {
                        _id: user._id,
                        id: user.userID,
                        email: user.contactInfo?.email?.email,
                        name: user.userName?.displayName,
                        role: user.role,
                        profilePicture: user.userInfo?.profilePicture || null,
                    });
                }
            }
            catch (bcryptError) {
                console.log('bcrypt comparison failed, trying plain text for user:', email);
                // If bcrypt fails, it might be a plain text password (legacy)
                if (storedPassword === password) {
                    console.log('Plain text password match found for user:', email, 'migrating to bcrypt...');
                    // Migrate the password to bcrypt hash
                    try {
                        const saltRounds = 12;
                        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
                        await userModel_1.default.updateOne({ 'contactInfo.email.email': email }, { 'password.hashed': hashedPassword });
                        console.log('Password migrated to bcrypt for user:', email);
                    }
                    catch (migrationError) {
                        console.error('Failed to migrate password for user:', email, migrationError);
                    }
                    return done(null, {
                        _id: user._id,
                        id: user.userID,
                        email: user.contactInfo?.email?.email,
                        name: user.userName?.displayName,
                        role: user.role,
                        profilePicture: user.userInfo?.profilePicture || null,
                    });
                }
            }
            console.log('Password comparison failed for user:', email);
            return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, false, { message: 'Invalid email or password' });
    }
    catch (error) {
        console.error('Authorization error:', error);
        return done(error);
    }
}));
// JWT Strategy for protecting routes
passport_1.default.use(new passport_jwt_1.Strategy({
    jwtFromRequest: jwtExtractor,
    secretOrKey: process.env.ACCESS_TOKEN_SECRET || 'access-secret',
}, async (payload, done) => {
    try {
        const user = await (0, userServices_1.getUserByEmail)(payload.email);
        if (user) {
            return done(null, {
                _id: user._id,
                id: user.userID,
                email: user.contactInfo?.email?.email,
                // Proper name fields structure
                firstName: user.userName?.firstName,
                lastName: user.userName?.lastName,
                displayName: user.userName?.displayName,
                name: user.userName?.firstName && user.userName?.lastName
                    ? `${user.userName.firstName} ${user.userName.lastName}`.trim()
                    : user.userName?.displayName,
                role: user.role,
                profilePicture: user.userInfo?.profilePicture || null,
            });
        }
        return done(null, false);
    }
    catch (error) {
        return done(error, false);
    }
}));
const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;
let googleStrategyRegistered = false;
if (googleClientId && googleClientSecret) {
    try {
        passport_1.default.use(new passport_google_oauth20_1.Strategy({
            clientID: googleClientId,
            clientSecret: googleClientSecret,
            callbackURL: 'http://localhost:3000/auth/google/callback', // Use full absolute URL
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) {
                    return done(new Error('No email from Google'), false);
                }
                // Check if user exists
                let existingUser = await (0, userServices_1.getUserByEmail)(email);
                if (existingUser) {
                    return done(null, {
                        _id: existingUser._id,
                        id: existingUser.userID,
                        email: existingUser.contactInfo?.email?.email,
                        name: existingUser.userName?.displayName,
                        role: existingUser.role,
                        profilePicture: existingUser.userInfo?.profilePicture || null,
                    });
                }
                // Create new user for Google OAuth
                const newUserData = {
                    userName: {
                        firstName: profile.name?.givenName || 'Unknown',
                        lastName: profile.name?.familyName || 'User',
                        displayName: profile.displayName || 'Unknown User',
                    },
                    contactInfo: {
                        email: {
                            email: email,
                            verified: true, // Google emails are verified
                            verifiedAt: new Date(),
                            verificationCode: 'verified',
                        },
                        phone: {
                            countryCode: '+1',
                            phoneNumber: `oauth${Date.now()}${Math.floor(Math.random() * 1000)}`, // Generate unique phone number for OAuth users
                            verified: false,
                            verifiedAt: null,
                            verificationCode: '000000',
                        },
                    },
                    password: {
                        hashed: crypto_1.default.randomBytes(32).toString('hex'), // Random password for OAuth users
                        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    },
                    userInfo: {
                        gender: 'unknown',
                        nationality: 'unknown',
                        address: {
                            city: 'unknown',
                            country: 'unknown',
                        },
                        profilePicture: profile.photos?.[0]?.value || '', // Save Google profile picture here
                    },
                    role: 'owner',
                    active: true,
                };
                const newUser = await userModel_1.default.create(newUserData);
                return done(null, {
                    _id: newUser._id,
                    id: newUser.userID,
                    email: newUser.contactInfo?.email?.email,
                    name: newUser.userName?.displayName,
                    role: newUser.role,
                    profilePicture: newUser.userInfo?.profilePicture || null,
                });
            }
            catch (error) {
                console.error('Google OAuth error:', error);
                return done(error, false);
            }
        }));
        googleStrategyRegistered = true;
    }
    catch (error) {
        console.error('Error registering Google OAuth strategy:', error);
    }
}
else {
}
// Passport serialization for session management
passport_1.default.serializeUser((user, done) => {
    // Store the user ID in the session
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        // Find user by userID when deserializing from session
        const user = await userModel_1.default.findOne({ userID: id });
        if (user) {
            const sessionUser = {
                id: user.userID,
                _id: user._id,
                email: user.contactInfo?.email?.email,
                name: user.userName?.displayName,
                role: user.role,
                profilePicture: user.userInfo?.profilePicture || null,
                userName: user.userName
            };
            done(null, sessionUser);
        }
        else {
            done(null, false);
        }
    }
    catch (error) {
        console.error('Error deserializing user:', error);
        done(error, null);
    }
});
// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Authentication error',
                error: 'AUTH_ERROR',
            });
        }
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Invalid or missing token',
                error: 'UNAUTHORIZED',
            });
        }
        req.user = user;
        next();
    })(req, res, next);
};
// POST /auth/register - Register new users
router.post('/register', async (req, res) => {
    try {
        const { userName, contactInfo, password } = req.body;
        // Validation
        if (!userName?.firstName || !userName?.lastName) {
            return res.status(400).json({
                success: false,
                message: 'First name and last name are required',
                error: 'VALIDATION_ERROR',
            });
        }
        if (!contactInfo?.email?.email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
                error: 'VALIDATION_ERROR',
            });
        }
        if (!contactInfo?.phone?.phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required',
                error: 'VALIDATION_ERROR',
            });
        }
        // Handle password - check if it's an object or string
        let passwordValue;
        if (typeof password === 'string') {
            passwordValue = password;
        }
        else if (password && typeof password === 'object' && password.hashed) {
            passwordValue = password.hashed;
        }
        else if (password && typeof password === 'object' && password.password) {
            passwordValue = password.password;
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Password is required',
                error: 'VALIDATION_ERROR',
            });
        }
        if (!passwordValue) {
            return res.status(400).json({
                success: false,
                message: 'Password is required',
                error: 'VALIDATION_ERROR',
            });
        }
        // Hash the password with bcrypt
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(passwordValue, saltRounds);
        // Check if email already exists
        const existingEmailUser = await userModel_1.default.findOne({
            'contactInfo.email.email': contactInfo.email.email,
        });
        if (existingEmailUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already in use',
                error: 'EMAIL_EXISTS',
            });
        }
        // Check if phone number already exists
        const existingPhoneUser = await userModel_1.default.findOne({
            'contactInfo.phone.phoneNumber': contactInfo.phone.phoneNumber,
        });
        if (existingPhoneUser) {
            return res.status(409).json({
                success: false,
                message: 'Phone number already in use',
                error: 'PHONE_EXISTS',
            });
        }
        const data = {
            userName: {
                firstName: userName.firstName,
                lastName: userName.lastName,
                displayName: `${userName.firstName} ${userName.lastName?.charAt(0)}.`,
            },
            contactInfo: {
                email: {
                    email: contactInfo.email.email,
                    verified: false,
                    verifiedAt: null,
                    verificationCode: '666444',
                },
                phone: {
                    countryCode: '+966',
                    phoneNumber: contactInfo.phone.phoneNumber,
                    verified: false,
                    verifiedAt: null,
                    verificationCode: '555333',
                },
            },
            password: {
                hashed: hashedPassword, // Use the properly hashed password
                expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
            userInfo: {
                gender: 'unknown',
                nationality: 'somewhere',
                address: {
                    city: 'here',
                    country: 'there',
                },
                profilePicture: '', // Empty profile picture for regular registration
            },
            role: 'owner',
            active: true,
        };
        const newUser = await userModel_1.default.create(data);
        if (newUser) {
            return res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: {
                    userId: newUser.userID,
                    email: newUser.contactInfo.email.email,
                    displayName: newUser.userName.displayName,
                },
            });
        }
        else {
            return res.status(500).json({
                success: false,
                message: 'Failed to create user',
                error: 'USER_CREATION_FAILED',
            });
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during registration',
            error: 'INTERNAL_ERROR',
        });
    }
});
// POST /auth/login - Authenticate and issue tokens
router.post('/login', (req, res, next) => {
    passport_1.default.authenticate('local', { session: true }, // Enable session for persistent login
    async (err, user, info) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: 'INTERNAL_ERROR',
            });
        }
        if (!user) {
            return res.status(401).json({
                success: false,
                message: info?.message || 'Invalid email or password',
                error: 'INVALID_CREDENTIALS',
            });
        }
        try {
            // Log the user in (this will call serializeUser)
            req.logIn(user, { session: true }, async (err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to log in user',
                        error: 'LOGIN_ERROR'
                    });
                }
                // Generate tokens
                const accessToken = (0, tokenUtils_1.generateAccessToken)({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                });
                const refreshToken = (0, tokenUtils_1.generateRefreshToken)();
                // Store refresh token in database
                await (0, tokenUtils_1.storeRefreshToken)(user.id, refreshToken);
                // Set refresh token as HTTP-only cookie
                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                });
                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    data: {
                        user: {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                        },
                        token: accessToken, // Frontend expects 'token'
                        accessToken, // Keep both for compatibility
                    },
                });
            });
        }
        catch (error) {
            console.error('Token generation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate tokens',
                error: 'TOKEN_ERROR',
            });
        }
    })(req, res, next);
});
// POST /auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not provided',
                error: 'NO_REFRESH_TOKEN',
            });
        }
        // Verify refresh token
        const userId = await (0, tokenUtils_1.verifyRefreshToken)(refreshToken);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
                error: 'INVALID_REFRESH_TOKEN',
            });
        }
        // Get user data
        const user = await userModel_1.default.findOne({ userID: userId });
        if (!user || !user.userID) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                error: 'USER_NOT_FOUND',
            });
        }
        // Generate new access token
        const accessToken = (0, tokenUtils_1.generateAccessToken)({
            id: user.userID,
            email: user.contactInfo?.email?.email || '',
            name: user.userName?.displayName || '',
            role: user.role,
        });
        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken,
            },
        });
    }
    catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to refresh token',
            error: 'REFRESH_ERROR',
        });
    }
});
// POST /auth/logout - Logout and invalidate refresh token
router.post('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await (0, tokenUtils_1.deleteRefreshToken)(refreshToken);
        }
        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        // Destroy session if it exists
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                }
            });
        }
        // Logout from passport session
        req.logout((err) => {
            if (err) {
                console.error('Passport logout error:', err);
            }
        });
        return res.status(200).json({
            success: true,
            message: 'Logout successful',
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: 'LOGOUT_ERROR',
        });
    }
});
// GET /auth/me - Get authenticated user data
router.get('/me', authenticateJWT, (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'User data retrieved',
        data: {
            user: req.user,
        },
    });
});
// GET /auth/google - Start Google OAuth
router.get('/google', (req, res, next) => {
    // Check if Google strategy is available
    if (!googleStrategyRegistered) {
        return res.status(501).json({
            success: false,
            message: 'Google OAuth is not configured or strategy not registered',
            error: 'OAUTH_NOT_CONFIGURED',
        });
    }
    const origin = req.get('Origin') || req.get('Referer') || 'http://localhost:3000';
    req.session = req.session || {};
    req.session.returnUrl = origin;
    next();
}, passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
    session: true, // Enable session for Google OAuth
}));
// GET /auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', passport_1.default.authenticate('google', { session: true }), // Enable session for callback
async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            console.error('No user found in Google OAuth callback');
            const returnUrl = req.session?.returnUrl ||
                process.env.FRONTEND_URL ||
                'http://localhost:3000';
            return res.redirect(`${returnUrl}/auth/error?message=no_user`);
        }
        // Log the user in to create a session
        req.logIn(user, { session: true }, async (err) => {
            if (err) {
                console.error('Failed to log in user via Google OAuth:', err);
                let returnUrl = req.session?.returnUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
                returnUrl = returnUrl.replace(/\/$/, '');
                return res.redirect(`${returnUrl}/auth/error?message=login_error`);
            }
            // Generate tokens
            const accessToken = (0, tokenUtils_1.generateAccessToken)({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            });
            const refreshToken = (0, tokenUtils_1.generateRefreshToken)();
            // Store refresh token
            await (0, tokenUtils_1.storeRefreshToken)(user.id, refreshToken);
            // Set refresh token as HTTP-only cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            // Get return URL and fix double slash issue
            let returnUrl = req.session?.returnUrl ||
                process.env.FRONTEND_URL ||
                'http://localhost:3000';
            // Remove trailing slash to prevent double slashes
            returnUrl = returnUrl.replace(/\/$/, '');
            // Clean up session
            if (req.session) {
                delete req.session.returnUrl;
            }
            // Redirect with access token
            return res.redirect(`${returnUrl}/auth/callback?token=${accessToken}`);
        });
    }
    catch (error) {
        console.error('Google callback error:', error);
        let returnUrl = req.session?.returnUrl ||
            process.env.FRONTEND_URL ||
            'http://localhost:3000';
        returnUrl = returnUrl.replace(/\/$/, '');
        return res.redirect(`${returnUrl}/auth/error?message=callback_error`);
    }
}); // Debug route to check authentication status
router.get('/debug/auth-status', (req, res) => {
    res.json({
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        hasUser: !!req.user,
        user: req.user ? {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
        } : null,
        sessionID: req.sessionID,
        hasSession: !!req.session,
        cookies: req.cookies
    });
});
// Utility endpoint to migrate plain text passwords to bcrypt (for development/migration)
router.post('/migrate-passwords', async (req, res) => {
    try {
        // Add basic authentication check here if needed
        const { adminSecret } = req.body;
        if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'dev-migrate-123') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const users = await userModel_1.default.find({});
        let migrated = 0;
        let skipped = 0;
        for (const user of users) {
            if (user.password?.hashed) {
                const storedPassword = user.password.hashed;
                // Check if it's already a bcrypt hash (bcrypt hashes start with $2a$, $2b$, or $2y$)
                if (storedPassword.startsWith('$2')) {
                    skipped++;
                    continue;
                }
                // Migrate plain text password to bcrypt
                try {
                    const saltRounds = 12;
                    const hashedPassword = await bcryptjs_1.default.hash(storedPassword, saltRounds);
                    await userModel_1.default.updateOne({ _id: user._id }, { 'password.hashed': hashedPassword });
                    migrated++;
                    console.log(`Migrated password for user: ${user.contactInfo?.email?.email}`);
                }
                catch (error) {
                    console.error(`Failed to migrate password for user: ${user.contactInfo?.email?.email}`, error);
                }
            }
        }
        return res.json({
            success: true,
            message: 'Password migration completed',
            migrated,
            skipped,
            total: users.length,
        });
    }
    catch (error) {
        console.error('Migration error:', error);
        return res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message,
        });
    }
});
// Error handling middleware
const authErrorHandler = (err, req, res, next) => {
    console.error('Auth error:', err);
    if (err.message.includes('Invalid credentials')) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
            error: 'INVALID_CREDENTIALS',
        });
    }
    if (err.message.includes('User not found')) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
            error: 'USER_NOT_FOUND',
        });
    }
    return res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: 'AUTH_ERROR',
    });
};
// Apply error handler
router.use(authErrorHandler);
exports.AuthAPI = router;
