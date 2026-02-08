function buildLikesController({ liked }) {
  return {
    toggleLike: async (req, res) => {
      try {
        const { id, type } = req.body;
        const userId = req.session.user.id;

        const ifExist = await liked.findOne({ itemId: id, type, userId });

        if (!ifExist) {
          await liked.insertOne({ itemId: id, type, userId });
          return res.json({ liked: true });
        } else {
          await liked.deleteOne({ itemId: id, type, userId });
          return res.json({ liked: false });
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
      }
    },

    getLiked: async (req, res) => {
      try {
        const userId = req.session.user.id;
        const items = await liked.find({ userId }).toArray();
        res.json(items);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
      }
    },
  };
}

module.exports = { buildLikesController };
