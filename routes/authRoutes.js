const passport = require('passport');
const popupTools = require('popup-tools');

module.exports = app => {
  // app.post(
  //   '/google-popup',
  //   passport.authenticate('google', {
  //     scope: ['profile', 'email']
  //   })
  // );

  app.get(
    '/auth/google',
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })
  );

  app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
    res.set({ 'content-type': 'text/html; charset=utf-8' });
    res.end(popupTools.popupResponse(req.user));
  });

  // app.get('/surveys', (req, res) => {
  //   res.redirect('/surveys');
  // });
  app.get('/api/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.get('/api/current_user', (req, res) => {
    res.send(req.user);
  });
};
