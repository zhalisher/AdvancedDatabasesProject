const { ObjectId } = require('mongodb');

function buildContentController({ movies, tv }) {
  return {
    getMovies: async (req, res) => {
      const data = await movies.find().toArray();
      res.json(data);
    },

    getTvSeries: async (req, res) => {
      const data = await tv.find().toArray();
      res.json(data);
    },

    getMovieById: async (req, res) => {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'No ID provided' });
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

      const doc = await movies.findOne({ _id: new ObjectId(id) });
      if (!doc) return res.status(404).json({ error: 'Movie not found' });
      res.json(doc);
    },

    getTvById: async (req, res) => {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'No ID provided' });
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

      const doc = await tv.findOne({ _id: new ObjectId(id) });
      if (!doc) return res.status(404).json({ error: 'Tv series not found' });
      res.json(doc);
    },

    searchByTitle: async (req, res) => {
      try {
        const title = req.body.title;
        if (!title) return res.status(400).send('Title is required');

        const regex = { $regex: `^${title}$`, $options: 'i' };

        let item = await movies.findOne({ title: regex });
        let type = 'movie';

        if (!item) {
        item = await tv.findOne({ title: regex });
        type = 'tv';
        }

        if (!item) return res.status(404).send('Item not found');

        res.redirect(`/watch.html?id=${item._id}&type=${type}`);

      } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
      }
    }
  };
}

module.exports = { buildContentController };
