import { User, Tweet,Comment,FollowRequest } from '../models/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';

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
};export const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user?.id; 

        const user = await User.findOne({
            where: { username },
            attributes: ['id', 'username', 'displayName', 'avatar', 'bio', 'createdAt', 'isPrivate'],
            include: [
                { 
                    model: Tweet, 
                    as: 'Tweets', 
                    attributes: ['id', 'content', 'image', 'createdAt'],
                    include: [
                        { 
                            model: User, 
                            as: 'LikedByUsers', 
                            attributes: ['id'] // Dovoljan nam je samo ID da izbrojimo
                        },
                        { 
                            model: Comment, 
                            attributes: ['id'] // Dovoljan nam je samo ID da izbrojimo
                        }
                    ]
                },
                { model: User, as: 'Followers', attributes: ['id', 'username', 'displayName', 'avatar'] },
                { model: User, as: 'Following', attributes: ['id', 'username', 'displayName', 'avatar'] }
            ],
            order: [[ { model: Tweet, as: 'Tweets' }, 'createdAt', 'DESC' ]]
        });

        if (!user) return res.status(404).json({ message: 'Korisnik nije pronađen' });

        const userData = user.toJSON();

        // Mapiramo tweetove da dodamo likesCount i repliesCount koje Frontend očekuje
        if (userData.Tweets) {
            userData.Tweets = userData.Tweets.map(t => ({
                ...t,
                likesCount: t.LikedByUsers?.length || 0,
                repliesCount: t.Comments?.length || 0,
                // Provjera je li trenutni korisnik lajkao ovaj tweet
                isLiked: t.LikedByUsers?.some(u => u.id === currentUserId) || false
            }));
        }

        userData.isFollowing = user.Followers.some(f => f.id === currentUserId);
        userData.followersCount = user.Followers?.length || 0;
        userData.followingCount = user.Following?.length || 0;

        // Provjera poslanog zahtjeva ako je profil privatan
        const pendingRequest = await FollowRequest.findOne({
            where: { senderId: currentUserId, recipientId: user.id, status: 'pending' }
        });
        userData.followStatus = pendingRequest ? 'pending' : 'none';

        // --- LOGIKA PRIVATNOSTI ---
        if (user.isPrivate && !userData.isFollowing && user.id !== currentUserId) {
            userData.Tweets = []; 
            userData.isLocked = true; 
        }

        res.json(userData);
    } catch (error) {
        console.error("Greška u getUserByUsername:", error);
        res.status(500).json({ message: 'Greška na serveru', error: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: ['id', 'username', 'displayName', 'avatar', 'isPrivate']
        });

        if (!user) {
            return res.status(404).json({ message: 'Korisnik nije pronađen' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Greška na serveru', error: error.message });
    }

};
export const searchGeneral = async (req, res) => {
    try {
        const { query } = req.query;
        const currentUserId = req.user?.id;

        if (!query) return res.json({ users: [], tweets: [] });

        // Provjera radi li se o hashtagu
        if (query.startsWith('#')) {
            const tweets = await Tweet.findAll({
                where: { content: { [Op.like]: `%${query}%` } },
                include: [
                    { model: User, attributes: ['id', 'username', 'displayName', 'avatar'] },
                    { model: User, as: 'LikedByUsers', attributes: ['id'], thorough: 'Likes' }, // Za broj lajkova
                    { model: Comment, attributes: ['id'] } // Za broj komentara
                ],
                order: [['createdAt', 'DESC']],
                limit: 20
            });
            return res.json({ type: 'posts', data: tweets });
        }

        // Standardna pretraga korisnika
        const users = await User.findAll({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { username: { [Op.like]: `%${query}%` } },
                            { displayName: { [Op.like]: `%${query}%` } }
                        ]
                    },
                    { id: { [Op.ne]: currentUserId } }
                ]
            },
            attributes: ['id', 'username', 'displayName', 'avatar', 'isPrivate'],
            limit: 10 
        });

        res.json({ type: 'users', data: users });
    } catch (error) {
        console.error("Greška u search:", error);
        res.status(500).json({ message: 'Greška pri pretrazi' });
    }
};