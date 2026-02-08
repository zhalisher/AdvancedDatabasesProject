const express = require('express');

function buildAdminRouter({ requireAdmin, admin }) {
  const r = express.Router();

  // all endpoints require admin
  r.post('/select', requireAdminApi, admin.select);

  r.post('/insert', requireAdminApi, admin.insertMovie);
  r.post('/inserttv', requireAdminApi, admin.insertTv);

  r.put('/update', requireAdminApi, admin.updateMovie);
  r.put('/updatetv', requireAdminApi, admin.updateTv);

  r.delete('/delete', requireAdminApi, admin.deleteOne);

  return r;

  // helper: requireAdmin without UI path 
    function requireAdminApi(req, res, next) {
    if (!req.session.user) {
        return res.status(401).end(); 
    }
    if (req.session.user.role !== 1) {
        return res.status(403).end(); 
    }
    next();
    }
}

module.exports = { buildAdminRouter };
