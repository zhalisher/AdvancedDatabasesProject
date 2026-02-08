function buildStatsController({ movies, tv, users, liked }) {
  return {
    overview: async (req, res) => {
      try {
        const [
          totalMovies,
          totalTv,
          totalUsers,
          totalLikes,
          topLiked
        ] = await Promise.all([
          movies.countDocuments(),
          tv.countDocuments(),
          users.countDocuments(),
          liked.countDocuments(),
          liked.aggregate([
            {
              $group: {
                _id: { itemId: "$itemId", type: "$type" },
                likes: { $sum: 1 }
              }
            },
            { $sort: { likes: -1 } },
            { $limit: 5 }
          ]).toArray()
        ]);

        res.json({
          totals: {
            movies: totalMovies,
            tvSeries: totalTv,
            users: totalUsers,
            likes: totalLikes
          },
          topLiked
        });

      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Stats failed' });
      }
    }
  };
}
module.exports = { buildStatsController };
