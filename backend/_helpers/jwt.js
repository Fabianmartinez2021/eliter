const expressJwt = require('express-jwt');
const config = require('../config.json');
const userService = require('../services/user.service');

// Cache en memoria: evita consultar la BD en cada request (TTL 60 segundos por usuario)
const USER_EXISTS_CACHE_TTL_MS = 60 * 1000;
const userExistsCache = new Map();

function isUserCachedAndExists(userId) {
    const entry = userExistsCache.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        userExistsCache.delete(userId);
        return null;
    }
    return entry.exists;
}

function setUserExistsCache(userId, exists) {
    userExistsCache.set(userId, { exists, expiresAt: Date.now() + USER_EXISTS_CACHE_TTL_MS });
}

module.exports = jwt;

function jwt() {
    const secret = config.secret;
    return expressJwt({ secret, isRevoked }).unless({
        path: [
            // rutas públicas que no requieren autenticación
            '/users/authenticate',
            '/users/forgot-password',
            '/users/reset-password',
            '/users/verify-email',
            /^\/seed\/seed-db\/([^\/]*)$/,
            /^\/seed\/seed-db-user\/([^\/]*)$/,
            /^\/seed\/clean-db\/([^\/]*)$/,
            /^\/cron\/cron-inventory\/([^\/]*)$/,
            /^\/api\/webhook\/(.*)$/
        ]
    });
}

async function isRevoked(req, payload, done) {
    const userId = payload.sub;

    const cached = isUserCachedAndExists(userId);
    if (cached === true) return done(); // usuario existe, token válido
    if (cached === false) return done(null, true); // usuario no existe, revocar

    const user = await userService.getById(userId);
    const exists = !!user;
    setUserExistsCache(userId, exists);

    if (!user) {
        return done(null, true);
    }
    done();
}