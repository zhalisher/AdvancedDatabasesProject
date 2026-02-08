const express = require('express');
const path = require('path');
const { requireAuth, requireAdmin } = require('../middleware/auth');

function pagesRouter(uiRootPath) {
        
    const r = express.Router();

    // Admin protected static 
    r.use('/admin', requireAdmin(uiRootPath), express.static(path.join(uiRootPath, 'admin')));

    // Public pages
    r.get('/', (req, res) => res.sendFile(path.join(uiRootPath, 'views', 'landing.html')));
    r.get('/landing.html', (req, res) => res.sendFile(path.join(uiRootPath, 'views', 'landing.html')));
    r.get('/signup.html', (req, res) => res.sendFile(path.join(uiRootPath, 'views', 'signup.html')));
    r.get('/login.html', (req, res) => res.sendFile(path.join(uiRootPath, 'views', 'login.html')));
    r.get('/recover.html', (req, res) => res.sendFile(path.join(uiRootPath, 'views', 'recover.html')));
    r.get('/reset.html', (req, res) => res.sendFile(path.join(uiRootPath, 'views', 'reset.html')));


    // Auth protected pages
    r.get('/main.html', requireAuth, (req, res) => res.sendFile(path.join(uiRootPath, 'views', 'main.html')));
    r.get('/watch.html', requireAuth, (req, res) => res.sendFile(path.join(uiRootPath, 'views', 'watch.html')));
    r.get('/about.html', requireAuth, (req, res) => res.sendFile(path.join(uiRootPath, 'views', 'about.html')));
    r.get('/contact.html', requireAuth, (req, res) => res.sendFile(path.join(uiRootPath, 'views', 'contact.html')));

    return r;
}

module.exports = { pagesRouter };
