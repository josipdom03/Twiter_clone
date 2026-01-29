import User from '../models/User.js';

export const getProfile = async (req, res) => {
  try {
    // req.user.id dolazi iz tvog auth middleware-a (JWT provjera)
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'verificationToken'] } // Ne šaljemo osjetljive podatke
    });

    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Greška pri dohvaćanju profila', error: error.message });
  }
};

// Dodatna funkcija za ažuriranje profila (bio, avatar)
export const updateProfile = async (req, res) => {
  try {
    const { bio, avatar, username } = req.body;
    const user = await User.findByPk(req.user.id);

    if (user) {
      user.bio = bio || user.bio;
      user.avatar = avatar || user.avatar;
      user.username = username || user.username;
      
      await user.save();
      res.json(user);
    }
  } catch (error) {
    res.status(500).json({ message: 'Greška pri ažuriranju profila' });
  }
};