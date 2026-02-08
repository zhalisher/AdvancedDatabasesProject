const bcrypt = require('bcrypt');

const crypto = require('crypto');
const { ObjectId } = require('mongodb');

const resetTokens = new Map(); 

function makeToken() {
  return crypto.randomBytes(24).toString('hex');
}

function buildAuthController({ users }) {
  return {
    signup: async (req, res) => {
      try {
        const { name, email, password } = req.body;

        const ifExist = await users.findOne({ email });
        if (ifExist) return res.redirect('/signup.html?error=exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        const recoveryKey = crypto.randomBytes(9).toString('hex'); 
        const recoveryKeyHash = await bcrypt.hash(recoveryKey, 10);
        await users.insertOne({
            name,
            email,
            password: hashedPassword,    
            role: 0,
            recoveryKeyHash

        });
        return res.redirect(`/login.html?recoveryKey=${encodeURIComponent(recoveryKey)}`);
      } catch (err) {
        console.error(err);
        res.redirect('/signup.html?error=server');
      }
    },

    login: async (req, res) => {
      try {
        const { email, password } = req.body;

        const user = await users.findOne({ email });
        const match = user && (await bcrypt.compare(password, user.password));

        if (!user || !match) return res.redirect('/login.html?error=invalid');

        req.session.user = {
          id: user._id.toString(),
          name: user.name,
          role: user.role,
        };

        res.redirect('/main.html');
      } catch (err) {
        console.error(err);
        res.redirect('/login.html?error=server');
      }
    },

    logout: (req, res) => {
      req.session.destroy(() => {
        res.clearCookie('sid');
        res.redirect('/landing.html');
      });
    },
    recover: async (req, res) => {
        try {
            const { email, recoveryKey } = req.body;
            if (!email || !recoveryKey) {
            return res.redirect('/recover.html?error=missing');
            }

            const user = await users.findOne({ email });
            if (!user || !user.recoveryKeyHash) {
            return res.redirect('/recover.html?error=invalid');
            }

            const ok = await bcrypt.compare(String(recoveryKey), user.recoveryKeyHash);
            if (!ok) return res.redirect('/recover.html?error=invalid');

            const token = makeToken();
            resetTokens.set(token, {
            userId: user._id.toString(),
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 минут
            });

            return res.redirect(`/reset.html?token=${encodeURIComponent(token)}`);
        } catch (err) {
            console.error(err);
            return res.redirect('/recover.html?error=server');
        }
    },
    resetPassword: async (req, res) => {
        try {
            const { token, newPassword, repeatPassword } = req.body;

            const entry = resetTokens.get(token);
            if (!entry || entry.expiresAt < Date.now()) {
            resetTokens.delete(token);
            return res.redirect('/recover.html?error=expired');
            }

            if (!newPassword || !repeatPassword) {
            return res.redirect(`/reset.html?token=${encodeURIComponent(token)}&error=missing`);
            }

            if (String(newPassword) !== String(repeatPassword)) {
            return res.redirect(`/reset.html?token=${encodeURIComponent(token)}&error=nomatch`);
            }

            if (String(newPassword).length < 6) {
            return res.redirect(`/reset.html?token=${encodeURIComponent(token)}&error=weak`);
            }

            const hashed = await bcrypt.hash(String(newPassword), 10);

            await users.updateOne(
            { _id: new ObjectId(entry.userId) },
            { $set: { password: hashed } }
            );

            resetTokens.delete(token);
            return res.redirect('/login.html?ok=reset');
        } catch (err) {
            console.error(err);
            return res.redirect('/recover.html?error=server');
        }
    },
    me: (req, res) => {
      if (!req.session.user) {
        return res.status(401).json({ loggedIn: false });
      }

      res.json({
        loggedIn: true,
        id: req.session.user.id, 
        name: req.session.user.name,
        role: req.session.user.role,
      });
    },
  };
}


module.exports = { buildAuthController };
