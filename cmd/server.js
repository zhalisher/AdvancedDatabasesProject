require('dotenv').config();

const express = require('express');
const path = require('path');

const {
  connectDB,
  getUsersCollection,
  getMoviesCollection,
  getTvCollection,
  getLikedCollection
} = require('../internal/db/db');

const { sessionMiddleware } = require('../internal/config/session');
const { logger } = require('../internal/middleware/logger');

const { pagesRouter } = require('../internal/routes/pages.routes');
const { apiRouter } = require('../internal/routes/api.routes');

async function main() {
  await connectDB();

  const collections = {
    users: getUsersCollection(),
    movies: getMoviesCollection(),
    tv: getTvCollection(),
    liked: getLikedCollection()
  };

  const app = express();

  console.log('logger:', typeof logger);
  console.log('sessionMiddleware:', typeof sessionMiddleware);
  console.log('pagesRouter:', typeof pagesRouter);
  console.log('apiRouter:', typeof apiRouter);


  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use(logger);
  app.use(sessionMiddleware());

  // static
  app.use(express.static(path.join(__dirname, '..', 'ui', 'public')));

  // pages
  app.use(pagesRouter(path.join(__dirname, '..', 'ui')));

  // api
  app.use('/api', apiRouter(collections));

  // 404
  app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', 'ui', 'views', '404.html'));
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
