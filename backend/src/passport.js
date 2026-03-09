import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Mora se točno podudarati s redirect_uris iz tvog JSON-a
    callbackURL: "http://localhost:3000/api/auth/google/callback" 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Potraži korisnika po emailu koji dolazi s Googlea
      let user = await User.findOne({ where: { email: profile.emails[0].value } });

      if (!user) {
        // Ako ne postoji, kreiramo novog
        user = await User.create({
          username: profile.displayName.replace(/\s/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
          email: profile.emails[0].value,
          googleId: profile.id,
          isVerified: true, // Google računi su već provjereni
          password: 'OAuth_User_No_Password' 
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));