const session = require('express-session');

function sessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET missing in .env');

  return session({
    name: 'sid',
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, 
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  });
}

module.exports = { sessionMiddleware };
