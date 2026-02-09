import { User, Tweet } from '../models/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- KONFIGURACIJA MULTERA ---
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `user-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({ 
    storage,
    limits: { fileSize: 2 * 1024 * 1024 } 
});

// --- KONTROLER FUNKCIJE ---

export const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'verificationToken'] },
            include: [
                { model: Tweet, as: 'Tweets', attributes: ['id', 'content', 'image', 'createdAt'] },
                { model: User, as: 'Followers', attributes: ['id'] },
                { model: User, as: 'Following', attributes: ['id'] }
            ],
            order: [[ { model: Tweet, as: 'Tweets' }, 'createdAt', 'DESC' ]]
        });

        if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' });
        
        const userData = user.toJSON();
        userData.followersCount = user.Followers?.length || 0;
        userData.followingCount = user.Following?.length || 0;

        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: 'Greška pri dohvaćanju profila', error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { bio, username, displayName } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' });

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) return res.status(400).json({ message: 'Korisničko ime je već zauzeto' });
            user.username = username;
        }

        user.bio = bio !== undefined ? bio : user.bio;
        user.displayName = displayName !== undefined ? displayName : user.displayName;

        if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            user.avatar = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        await user.save();
        const updatedUser = user.get({ plain: true });
        delete updatedUser.password;
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Greška pri ažuriranju profila' });
    }
};

export const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user?.id; 

        const user = await User.findOne({
            where: { username },
            attributes: ['id', 'username', 'displayName', 'avatar', 'bio', 'createdAt'],
            include: [
                { model: Tweet, as: 'Tweets', attributes: ['id', 'content', 'image', 'createdAt'] },
                { model: User, as: 'Followers', attributes: ['id', 'username'] },
                { model: User, as: 'Following', attributes: ['id', 'username'] }
            ],
            order: [[ { model: Tweet, as: 'Tweets' }, 'createdAt', 'DESC' ]]
        });

        if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' });

        const userData = user.toJSON();
        userData.followersCount = user.Followers?.length || 0;
        userData.followingCount = user.Following?.length || 0;
        userData.isFollowing = user.Followers.some(f => f.id === currentUserId);

        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: 'Greška na serveru', error: error.message });
    }
};

/**
 * 4. Zapratite korisnika + WEBSOCKET
 */
export const followUser = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.id;

        if (currentUserId == targetUserId) {
            return res.status(400).json({ message: 'Ne možete pratiti sami sebe' });
        }

        const userToFollow = await User.findByPk(targetUserId);
        const currentUser = await User.findByPk(currentUserId);

        if (!userToFollow) return res.status(404).json({ message: 'Korisnik nije pronađen' });

        await currentUser.addFollowing(userToFollow);

        // Dohvaćamo novi broj pratitelja nakon akcije
        const followersCount = await userToFollow.countFollowers();

        // SLANJE PREKO WEBSOCKETA
        // Koristimo req.io koji smo postavili u server.js
        if (req.io) {
            req.io.emit('update_followers', {
                userId: targetUserId,
                followersCount: followersCount
            });
        }

        res.json({ message: 'Uspješno zapraćeno', followersCount });
    } catch (error) {
        res.status(500).json({ message: 'Greška pri praćenju korisnika', error: error.message });
    }
};

/**
 * 5. Otpratite korisnika + WEBSOCKET
 */
export const unfollowUser = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.id;

        const currentUser = await User.findByPk(currentUserId);
        const userToUnfollow = await User.findByPk(targetUserId);

        if (!userToUnfollow) return res.status(404).json({ message: 'Korisnik nije pronađen' });

        await currentUser.removeFollowing(userToUnfollow);

        const followersCount = await userToUnfollow.countFollowers();

        // SLANJE PREKO WEBSOCKETA
        if (req.io) {
            req.io.emit('update_followers', {
                userId: targetUserId,
                followersCount: followersCount
            });
        }

        res.json({ message: 'Uspješno otpraćeno', followersCount });
    } catch (error) {
        res.status(500).json({ message: 'Greška pri otpraćivanju', error: error.message });
    }
};