import { User, Tweet } from '../models/index.js'; // Uvozimo iz index.js zbog relacija
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

/**
 * 1. Dohvaćanje vlastitog profila + TWEETOVI
 */
export const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'verificationToken'] },
            include: [{
                model: Tweet,
                as: 'Tweets',
                attributes: ['id', 'content', 'image', 'createdAt']
            }],
            order: [[ { model: Tweet, as: 'Tweets' }, 'createdAt', 'DESC' ]]
        });

        if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Greška pri dohvaćanju profila', error: error.message });
    }
};

/**
 * 2. Ažuriranje profila 
 */
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

/**
 * 3. Dohvaćanje tuđeg profila po username-u + TWEETOVI
 */
export const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username || username === 'undefined') return res.status(400).json({ message: 'Nevažeći username' });

        const user = await User.findOne({
            where: { username },
            attributes: ['id', 'username', 'displayName', 'avatar', 'bio', 'createdAt'],
            include: [{
                model: Tweet,
                as: 'Tweets',
                attributes: ['id', 'content', 'image', 'createdAt']
            }],
            order: [[ { model: Tweet, as: 'Tweets' }, 'createdAt', 'DESC' ]]
        });

        if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Greška na serveru', error: error.message });
    }
};