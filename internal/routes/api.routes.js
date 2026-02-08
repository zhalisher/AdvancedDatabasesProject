const express = require('express');

const { buildAdminRouter } = require('./admin.routes');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const { buildAdminController } = require('../controllers/admin.controller');
const { buildContentController } = require('../controllers/content.controller');
const { buildAuthController } = require('../controllers/auth.controller');
const { buildLikesController } = require('../controllers/likes.controller');
const { buildCommentsController } = require('../controllers/comments.controller');
const { buildStatsController } = require('../controllers/stats.controller');

console.log('admin.controller module =', require('../controllers/admin.controller'));
console.log('buildAdminController typeof =', typeof buildAdminController);

function apiRouter(collections) {

    
    const r = express.Router();

    const auth = buildAuthController(collections);
    const content = buildContentController(collections);
    const likes = buildLikesController(collections);
    const comments = buildCommentsController(collections);
    const admin = buildAdminController(collections);
    const stats = buildStatsController(collections);

    // AUTH
    r.post('/signup', auth.signup);
    r.post('/login', auth.login);
    r.post('/logout', auth.logout);
    r.get('/me', auth.me);

    // RECOVER
    r.post('/recover', auth.recover);
    r.post('/reset-password', auth.resetPassword);


    // CONTENT
    r.get('/movies', content.getMovies);
    r.get('/tv-series', content.getTvSeries);
    r.get('/movies/watch', content.getMovieById);
    r.get('/tvSeries/watch', content.getTvById);

    // SEARCH BAR
    r.post('/search', content.searchByTitle);

    // LIKES
    r.post('/like', requireAuth, likes.toggleLike);
    r.get('/liked', requireAuth, likes.getLiked);

    // COMMENTS
    r.post('/comments', requireAuth, comments.addComment);
    r.get('/comments', requireAuth, comments.getComments);
    r.put('/comments/:commentId', requireAuth, comments.editComment);
    r.delete('/comments/:commentId', requireAuth, comments.deleteComment);
    

    // ADMIN API
    // /api/admin/*
    r.use('/admin', buildAdminRouter({ requireAdmin, admin }));
    
    // stats
    r.get('/stats/overview', requireAdmin, stats.overview);


    return r;
}

module.exports = { apiRouter };
