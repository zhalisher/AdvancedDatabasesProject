const { ObjectId } = require('mongodb');

function buildCommentsController({ movies, tv }) {
  function getCol(type) {
    return type === 'movie' ? movies : tv;
  }

  return {
    // POST /api/comments
    addComment: async (req, res) => {
      try {
        const { itemId, type, text } = req.body;

        if (!itemId || !type || !text) {
          return res.status(400).json({ error: 'itemId, type, text required' });
        }
        if (!ObjectId.isValid(itemId)) {
          return res.status(400).json({ error: 'Invalid itemId' });
        }
        if (!['movie', 'tv'].includes(type)) {
          return res.status(400).json({ error: 'Invalid type' });
        }

        const col = getCol(type);

        const comment = {
          _id: new ObjectId(),
          userId: req.session.user.id,
          userName: req.session.user.name,
          text: String(text).trim(),
          createdAt: new Date()
        };

        const result = await col.updateOne(
          { _id: new ObjectId(itemId) },
          { $push: { comments: comment } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ ok: true, comment });
      } catch (err) {
        console.error('POST /comments error', err);
        res.status(500).json({ error: 'Server error' });
      }
    },

    // GET /api/comments?itemId=...&type=movie|tv
    getComments: async (req, res) => {
      try {
        const { itemId, type } = req.query;

        if (!itemId || !type) {
          return res.status(400).json({ error: 'itemId and type required' });
        }
        if (!ObjectId.isValid(itemId)) {
          return res.status(400).json({ error: 'Invalid itemId' });
        }
        if (!['movie', 'tv'].includes(type)) {
          return res.status(400).json({ error: 'Invalid type (use movie or tv)' });
        }

        const col = getCol(type);

        const doc = await col.findOne(
          { _id: new ObjectId(itemId) },
          { projection: { comments: 1 } }
        );

        if (!doc) return res.status(404).json({ error: 'Item not found' });

        res.json(doc.comments || []);
      } catch (err) {
        console.error('GET /comments error:', err);
        res.status(500).json({ error: 'Server error' });
      }
    },

    // PUT /api/comments/:commentId
    editComment: async (req, res) => {
      try {
        const { commentId } = req.params;
        const { itemId, type, text } = req.body;

        if (!commentId || !ObjectId.isValid(commentId)) {
          return res.status(400).json({ error: 'Invalid commentId' });
        }
        if (!itemId || !ObjectId.isValid(itemId)) {
          return res.status(400).json({ error: 'Invalid itemId' });
        }
        if (!['movie', 'tv'].includes(type)) {
          return res.status(400).json({ error: 'Invalid type' });
        }
        const newText = String(text || '').trim();
        if (!newText) {
          return res.status(400).json({ error: 'Text required' });
        }

        const col = getCol(type);

        // редактировать может только автор
        const result = await col.updateOne(
          {
            _id: new ObjectId(itemId),
            comments: {
              $elemMatch: {
                _id: new ObjectId(commentId),
                userId: req.session.user.id
              }
            }
          },
          {
            $set: {
              'comments.$.text': newText,
              'comments.$.editedAt': new Date()
            }
          }
        );

        if (result.matchedCount === 0) {
          return res.status(403).json({ error: 'Not allowed or comment not found' });
        }

        res.json({ ok: true });
      } catch (err) {
        console.error('PUT /comments/:commentId error:', err);
        res.status(500).json({ error: 'Server error' });
      }
    },

    // DELETE /api/comments/:commentId
    deleteComment: async (req, res) => {
      try {
        const { commentId } = req.params;
        const { itemId, type } = req.body;

        if (!commentId || !ObjectId.isValid(commentId)) {
          return res.status(400).json({ error: 'Invalid commentId' });
        }
        if (!itemId || !ObjectId.isValid(itemId)) {
          return res.status(400).json({ error: 'Invalid itemId' });
        }
        if (!['movie', 'tv'].includes(type)) {
          return res.status(400).json({ error: 'Invalid type' });
        }

        const col = getCol(type);

        const result = await col.updateOne(
          { _id: new ObjectId(itemId) },
          {
            $pull: {
              comments: {
                _id: new ObjectId(commentId),
                userId: req.session.user.id // только автор может удалить
              }
            }
          }
        );

        if (result.modifiedCount === 0) {
          return res.status(403).json({ error: 'Not allowed or comment not found' });
        }

        res.json({ ok: true });
      } catch (err) {
        console.error('DELETE /comments/:commentId error:', err);
        res.status(500).json({ error: 'Server error' });
      }
    }
  };
}

module.exports = { buildCommentsController };
