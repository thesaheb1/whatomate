'use strict';

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('auth-passport');

/**
 * Configure Passport OAuth strategies.
 * Only enabled if credentials exist in environment.
 */
const configurePassport = () => {
  // ── Google OAuth ───────────────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          scope: ['profile', 'email'],
        },
        (accessToken, refreshToken, profile, done) => {
          const user = {
            provider: 'google',
            providerId: profile.id,
            email: profile.emails?.[0]?.value,
            fullName: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          };
          logger.debug('Google OAuth profile received', { email: user.email });
          return done(null, user);
        }
      )
    );
    logger.info('Google OAuth strategy enabled');
  }

  // ── Facebook OAuth ─────────────────────────────────────────────────────────
  if (process.env.FACEBOOK_OAUTH_APP_ID && process.env.FACEBOOK_OAUTH_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_OAUTH_APP_ID,
          clientSecret: process.env.FACEBOOK_OAUTH_APP_SECRET,
          callbackURL: process.env.FACEBOOK_CALLBACK_URL,
          profileFields: ['id', 'emails', 'name', 'picture'],
        },
        (accessToken, refreshToken, profile, done) => {
          const user = {
            provider: 'facebook',
            providerId: profile.id,
            email: profile.emails?.[0]?.value,
            fullName: `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
            avatarUrl: profile.photos?.[0]?.value,
          };
          logger.debug('Facebook OAuth profile received', { email: user.email });
          return done(null, user);
        }
      )
    );
    logger.info('Facebook OAuth strategy enabled');
  }
};

module.exports = { passport, configurePassport };
