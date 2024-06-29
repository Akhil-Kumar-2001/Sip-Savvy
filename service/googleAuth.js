const passport = require('passport');
const userSchema = require('../model/userSchema');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const dotenv = require('dotenv').config();

// Configure the Google strategy for use by Passport.
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true
}, async (request, accessToken, refreshToken, profile, done) => {
  try {
    // Check if the user exists in the database
    let user = await userSchema.findOne({ email: profile.email });
    
    if (!user) {
      // If user doesn't exist, create a new user
      user = new userSchema({
        name: profile.displayName,
        email: profile.email,
        googleID: profile.id
      });
      // Save the new user
      await user.save();
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

// Serialize the user ID to the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize the user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userSchema.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
