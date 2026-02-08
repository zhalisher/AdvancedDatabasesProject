const path = require('path');

function requireAuth(req, res, next) {
  if (req && res && next) {
    if (!req.session?.user) return res.status(401).json({ error: 'login_required' });
    return next();
  }

}


function requireAdmin(arg1, arg2, arg3) {
  const isApiCall = arg1 && arg2 && arg3 && typeof arg3 === 'function';
  if (isApiCall) {
    const req = arg1, res = arg2, next = arg3;

    if (!req.session?.user) return res.status(401).json({ error: 'login_required' });

    const role = req.session.user.role;
    const isAdmin = role === 1 || role === 'admin'; 
    if (!isAdmin) return res.status(403).json({ error: 'forbidden' });

    return next();
  }

  const uiRootPath = arg1;
  return function (req, res, next) {
    if (!req.session?.user) return res.redirect('/login.html?error=login_required');

    const role = req.session.user.role;
    const isAdmin = role === 1 || role === 'admin';
    if (!isAdmin) return res.redirect('/main.html?error=forbidden');

    next();
  };
}

module.exports = { requireAuth, requireAdmin };
