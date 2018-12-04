// prod.js - production keys here!!
module.exports = {
  googleClientID: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  mongoURI: process.env.MONGO_URI,
  cookieKey: process.env.COOKIE_KEY,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  sendGridKey: process.env.SEND_GRID_KEY,
  redirectDomain: process.env.REDIRECT_DOMAIN,
  beyondVerbalApiKey: process.env.BEYOND_VERBAL_API_KEY,
  wweApiKey: process.env.WWE_API_KEY,
  wweApiUrl: process.env.WWE_API_URL,
  wweClientId: process.env.WWE_CLIENT_ID,
  wweClientSecret: process.env.WWE_CLIENT_SECRET
};
