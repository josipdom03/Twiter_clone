import { User, Tweet } from '../models/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- KONFIGURACIJA MULTERA (Ostaje ista) ---
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `user-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
export const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// --- KONTROLER FUNKCIJE ---

export const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'verificationToken'] },
            include: [
                { model: Tweet, as: 'Tweets', attributes: ['id', 'content', 'image', 'createdAt'] },
                { model: User, as: 'Followers', attributes: ['id', 'username', 'displayName', 'avatar'] },
                { model: User, as: 'Following', attributes: ['id', 'username', 'displayName', 'avatar'] }
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
        const { bio, username, displayName, isPrivate } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' });

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) return res.status(400).json({ message: 'Korisničko ime je već zauzeto' });
            user.username = username;
        }

        user.bio = bio !== undefined ? bio : user.bio;
        user.displayName = displayName !== undefined ? displayName : user.displayName;
        
        // POPRAVAK: FormData šalje stringove, pretvaramo u Boolean
        if (isPrivate !== undefined) {
            user.isPrivate = isPrivate === 'true' || isPrivate === true;
        }

        if (req.file) {
            user.avatar = `uploads/${req.file.filename}`;
        }

        await user.save();
        // Vraćamo profil s uključenim asocijacijama (Tweets, Followers...)
        return getProfile(req, res); 
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
            attributes: ['id', 'username', 'displayName', 'avatar', 'bio', 'createdAt', 'isPrivate'], // Dodan isPrivate
            include: [
                { model: Tweet, as: 'Tweets', attributes: ['id', 'content', 'image', 'createdAt'] },
                { model: User, as: 'Followers', attributes: ['id', 'username', 'displayName', 'avatar'] },
                { model: User, as: 'Following', attributes: ['id', 'username', 'displayName', 'avatar'] }
            ],
            order: [[ { model: Tweet, as: 'Tweets' }, 'createdAt', 'DESC' ]]
        });

        if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' });

        const userData = user.toJSON();
        userData.isFollowing = user.Followers.some(f => f.id === currentUserId);
        userData.followersCount = user.Followers?.length || 0;
        userData.followingCount = user.Following?.length || 0;

        // --- LOGIKA PRIVATNOSTI ---
        // Ako je profil privatan, a nismo mi i ne pratimo ga
        if (user.isPrivate && !userData.isFollowing && user.id !== currentUserId) {
            userData.Tweets = []; // Sakrij tweetove
            userData.isLocked = true; // Info za frontend
        }

        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: 'Greška na serveru', error: error.message });
    }
};