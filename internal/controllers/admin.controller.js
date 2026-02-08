function buildAdminController({ movies, tv }) {
  return {
    select: async (req, res) => {
      try {
        const { title = '', type = 'all', genre, fields, exact = false } = req.body;

        const titleRegex = title
          ? (exact
              ? { $regex: `^${escapeRegex(title)}$`, $options: 'i' }
              : { $regex: escapeRegex(title), $options: 'i' })
          : null;

        const movieQuery = {};
        const tvQuery = {};

        if (titleRegex) {
          movieQuery.title = titleRegex;
          tvQuery.title = titleRegex;
        }
        if (genre) {
          movieQuery.genre = genre;
          tvQuery.genre = genre;
        }

        let movieRes = [];
        let tvRes = [];

        if (type === 'movie' || type === 'all') {
          movieRes = await movies.find(movieQuery).toArray();
          movieRes = movieRes.map(d => ({ ...d, __type: 'movie' }));
        }
        if (type === 'tv' || type === 'all') {
          tvRes = await tv.find(tvQuery).toArray();
          tvRes = tvRes.map(d => ({ ...d, __type: 'tv' }));
        }

        let items = [...movieRes, ...tvRes];

        if (fields) {
          const keep = fields.split(',').map(f => f.trim()).filter(Boolean);
          items = items.map(it => {
            const out = { _id: it._id, __type: it.__type };
            keep.forEach(k => {
              if (Object.prototype.hasOwnProperty.call(it, k)) out[k] = it[k];
            });
            return out;
          });
        }

        res.json(items);
      } catch (err) {
        console.error('select error', err);
        res.status(500).json({ error: 'Server error in select' });
      }
    },

    insertMovie: async (req, res) => {
      try {
        const { title, poster, description, genre, duration, iframe } = req.body;
        if (!title) return res.status(400).json({ error: 'Title required' });

        const result = await movies.insertOne({ title, poster, description, genre, duration, iframe });
        res.status(200).json({ message: 'Movie inserted', id: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Insert movie failed' });
      }
    },

    insertTv: async (req, res) => {
      try {
        const { title, poster, season, episode, description, genre, duration, iframe } = req.body;
        if (!title) return res.status(400).json({ error: 'Title required' });

        const result = await tv.insertOne({ title, poster, season, episode, description, genre, duration, iframe });
        res.status(200).json({ message: 'TV inserted', id: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Insert TV failed' });
      }
    },

    updateMovie: async (req, res) => {
      try {
        const { CurrTitle, ...updateFields } = req.body;
        if (!CurrTitle) return res.status(400).json({ error: 'Current title required' });

        const result = await movies.updateOne({ title: CurrTitle }, { $set: updateFields });
        if (result.matchedCount === 0) return res.status(404).json({ error: 'Movie not found' });

        res.status(200).json({ message: 'Movie updated' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update movie failed' });
      }
    },

    updateTv: async (req, res) => {
      try {
        const { CurrTitle, ...updateFields } = req.body;
        if (!CurrTitle) return res.status(400).json({ error: 'Current title required' });

        const result = await tv.updateOne({ title: CurrTitle }, { $set: updateFields });
        if (result.matchedCount === 0) return res.status(404).json({ error: 'TV series not found' });

        res.status(200).json({ message: 'TV updated' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update TV failed' });
      }
    },

    deleteOne: async (req, res) => {
      try {
        const { title, type } = req.body;
        if (!title) return res.status(400).json({ error: 'Title required' });
        if (!type) return res.status(400).json({ error: 'Type required' });

        const regex = { $regex: `^${escapeRegex(title)}$`, $options: 'i' };
        let deletedCount = 0;

        if (type === 'movie') {
          const movieRes = await movies.deleteOne({ title: regex });
          deletedCount = movieRes.deletedCount;
        } else if (type === 'tv') {
          const tvRes = await tv.deleteOne({ title: regex });
          deletedCount = tvRes.deletedCount;
        } else {
          return res.status(400).json({ error: 'Invalid type' });
        }

        if (deletedCount === 0) return res.status(404).json({ error: `${type} not found` });
        res.status(200).json({ deleted: deletedCount });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Delete failed' });
      }
    }
  };
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { buildAdminController };
