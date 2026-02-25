import { Tweet, User, Comment, Notification, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { getLinkPreview } from '../utils/linkPreview.js';
import multer from 'multer';
import path from 'path';

// --- MULTER KONFIGURACIJA ---
// Definiramo gdje se spremaju slike i kako se nazivaju
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Mapa mora postojati u root-u backenda
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Middleware za export u route file
export const upload = multer({ storage: storage });

/**
 * POMOĆNA FUNKCIJA: Izračunava i ažurira score za specifičan tweet.
 */
export const updateTweetScore = async (tweetId) => {
    try {
        const tweet = await Tweet.findByPk(tweetId, {
            include: [
                { model: User, as: 'LikedByUsers', attributes: ['id'] },
                { model: Comment, attributes: ['id'] }
            ]
        });

        if (!tweet) return;

        const likes = tweet.LikedByUsers?.length || 0;
        const comments = tweet.Comments?.length || 0;
        const retweetCount = await Tweet.count({ where: { parentId: tweetId } });

        const hoursSinceCreated = (Date.now() - new Date(tweet.createdAt).getTime()) / (1000 * 60 * 60);
        const gravity = 1.8;

        const baseScore = (likes * 2) + (retweetCount * 3) + (comments * 1);
        const newScore = baseScore / Math.pow(hoursSinceCreated + 2, gravity);

        await tweet.update({ score: newScore }, { hooks: false });
    } catch (err) {
        console.error("Greška pri ažuriranju score-a:", err);
    }
};

/**
 * Pomoćna funkcija za uniformno dohvaćanje tweetova s asocijacijama.
 */
const tweetIncludeSchema = (currentUserId) => [
    {
        model: User,
        attributes: [
            'id', 'username', 'displayName', 'avatar',
            [
                sequelize.literal(`EXISTS(SELECT 1 FROM follows WHERE follower_id = ${Number(currentUserId)} AND following_id = \`User\`.\`id\`)`),
                'isFollowing'
            ],
            [
                sequelize.literal(`EXISTS(SELECT 1 FROM follows WHERE follower_id = ${Number(currentUserId)} AND following_id = \`User\`.\`id\` AND notify = true)`),
                'isNotifying'
            ]
        ]
    },
    {
        model: Tweet,
        as: 'ParentTweet',
        include: [
            { 
                model: User, 
                attributes: ['id', 'username', 'displayName', 'avatar'] 
            },
            { 
                model: Comment, 
                attributes: ['id'] 
            },
            { 
                model: User, 
                as: 'LikedByUsers', 
                attributes: ['id'],
                through: { attributes: [] }
            }
        ]
    },
    {
        model: User,
        as: 'LikedByUsers',
        attributes: ['id'],
        through: { attributes: [] }
    },
    {
        model: Comment,
        attributes: ['id']
    }
];

export const getAllTweets = async (req, res) => {
    try {
        const currentUserId = req.user ? req.user.id : 0;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const totalTweets = await Tweet.count();

        const tweets = await Tweet.findAll({
            include: tweetIncludeSchema(currentUserId),
            order: [
                ['score', 'DESC'],
                ['createdAt', 'DESC']
            ],
            limit: limit,
            offset: offset
        });

        res.json({
            tweets: tweets,
            totalPages: Math.ceil(totalTweets / limit),
            currentPage: page,
            totalTweets: totalTweets
        });
    } catch (error) {
        console.error("SERVER ERROR (getAllTweets):", error);
        res.status(500).json({ message: error.message });
    }
};

export const createTweet = async (req, res) => {
    try {
        // Multer popunjava req.body i req.files
        const { content } = req.body;
        const authorId = req.user.id;

        console.log("--- NOVI TWEET ZAHTJEV ---");
        console.log("Tekst (req.body.content):", content);
        console.log("Datoteke (req.files):", req.files);

        // Mapiranje putanja slika
        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => `/uploads/${file.filename}`);
        }

        // --- LINK PREVIEW LOGIKA ---
        let previewData = {};
        const urlRegex = /(https?:\/\/[^\s]+)/;
        const match = content?.match(urlRegex);

        if (match) {
            const url = match[0];
            const metadata = await getLinkPreview(url);
            if (metadata) {
                previewData = {
                    linkUrl: url,
                    linkTitle: metadata.title,
                    linkDescription: metadata.description,
                    linkImage: metadata.image
                };
            }
        }

        // Slanje u bazu - image se sprema kao JSON string polja putanja
        const newTweet = await Tweet.create({
            content: content || "",
            image: imagePaths.length > 0 ? JSON.stringify(imagePaths) : null,
            userId: authorId,
            score: 0,
            ...previewData
        });

        console.log("Tweet uspješno kreiran. ID:", newTweet.id);

        // Slanje obavijesti pretplatnicima
        try {
            const subscribers = await sequelize.query(
                `SELECT follower_id FROM follows WHERE following_id = :authorId AND notify = true`,
                { replacements: { authorId }, type: sequelize.QueryTypes.SELECT }
            );

            if (subscribers.length > 0) {
                const notificationsData = subscribers.map(sub => ({
                    type: 'new_tweet',
                    recipientId: sub.follower_id,
                    senderId: authorId,
                    tweetId: newTweet.id,
                    isRead: false
                }));
                await Notification.bulkCreate(notificationsData);
            }
        } catch (notifError) {
            console.error("Greška pri slanju obavijesti:", notifError);
        }

        const fullTweet = await Tweet.findByPk(newTweet.id, {
            include: tweetIncludeSchema(authorId)
        });

        if (req.io) {
            req.io.emit('new_tweet', fullTweet);
        }

        res.status(201).json(fullTweet);
    } catch (error) {
        console.error("SERVER ERROR (createTweet):", error);
        res.status(500).json({ message: error.message });
    }
};

export const getTweetById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user ? req.user.id : 0;

        await updateTweetScore(id);

        const tweet = await Tweet.findByPk(id, {
            include: [
                ...tweetIncludeSchema(currentUserId).filter(inc => inc.model !== Comment),
                {
                    model: Comment,
                    include: [
                        {
                            model: User,
                            attributes: [
                                'id', 'username', 'displayName', 'avatar',
                                [
                                    sequelize.literal(`EXISTS(SELECT 1 FROM follows WHERE follower_id = ${Number(currentUserId)} AND following_id = \`User\`.\`id\`)`),
                                    'isFollowing'
                                ]
                            ]
                        },
                        {
                            model: User,
                            as: 'LikedByUsers',
                            attributes: ['id', 'username', 'displayName', 'avatar'],
                            through: { attributes: [] }
                        }
                    ],
                    separate: true, 
                    order: [['createdAt', 'DESC']]
                }
            ]
        });

        if (!tweet) return res.status(404).json({ message: "Objava nije pronađena" });
        res.json(tweet);
    } catch (error) {
        console.error("SERVER ERROR (getTweetById):", error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteTweet = async (req, res) => {
    try {
        const tweet = await Tweet.findByPk(req.params.id);
        if (!tweet) return res.status(404).json({ message: "Tweet nije pronađen" });
        
        if (tweet.userId !== req.user.id) {
            return res.status(403).json({ message: "Nemate dopuštenje za brisanje" });
        }

        await tweet.destroy();
        res.json({ message: "Tweet uspješno obrisan" });
    } catch (error) {
        console.error("SERVER ERROR (deleteTweet):", error);
        res.status(500).json({ message: error.message });
    }
};

export const getTrends = async (req, res) => {
    try {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const recentTweets = await Tweet.findAll({
            where: {
                createdAt: { [Op.gte]: tenDaysAgo },
                content: { [Op.ne]: null }
            },
            attributes: ['content']
        });

        const hashtagCounts = {};
        recentTweets.forEach(tweet => {
            const hashtags = tweet.content?.match(/#[a-z0-9_ćčšžđ]+/gi);
            if (hashtags) {
                hashtags.forEach(tag => {
                    const cleanTag = tag.toLowerCase();
                    hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
                });
            }
        });

        const sortedTrends = Object.entries(hashtagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        res.json(sortedTrends);
    } catch (err) {
        console.error("SERVER ERROR (getTrends):", err);
        res.status(500).json({ error: "Greška pri dohvaćanju trendova" });
    }
};

export const getFollowingTweets = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const following = await sequelize.query(
            `SELECT following_id FROM follows WHERE follower_id = :currentUserId`,
            { replacements: { currentUserId }, type: sequelize.QueryTypes.SELECT }
        );

        const followingIds = following.map(f => f.following_id);
        
        const { rows, count } = await Tweet.findAndCountAll({
            where: {
                userId: { [Op.in]: [...followingIds, currentUserId] }
            },
            include: tweetIncludeSchema(currentUserId),
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            tweets: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalTweets: count
        });
    } catch (error) {
        console.error("ERROR (getFollowingTweets):", error);
        res.status(500).json({ message: error.message });
    }
};

export const retweetTweet = async (req, res) => {
    try {
        const { id } = req.params;
        const authorId = req.user.id;

        const originalTweet = await Tweet.findByPk(id);
        if (!originalTweet) {
            return res.status(404).json({ message: "Originalna objava nije pronađena" });
        }

        const existingRetweet = await Tweet.findOne({
            where: {
                userId: authorId,
                parentId: id
            }
        });

        if (existingRetweet) {
            await existingRetweet.destroy();
            await updateTweetScore(id);
            return res.json({ message: "Retweet uklonjen", action: "unretweet" });
        }

        const newRetweet = await Tweet.create({
            content: null, 
            userId: authorId,
            parentId: id
        });

        await updateTweetScore(id);

        if (originalTweet.userId !== authorId) {
            await Notification.create({
                type: 'retweet',
                recipientId: originalTweet.userId,
                senderId: authorId,
                tweetId: id,
                isRead: false
            });
        }

        const fullRetweet = await Tweet.findByPk(newRetweet.id, {
            include: tweetIncludeSchema(authorId)
        });

        if (req.io) {
            req.io.emit('new_tweet', fullRetweet);
        }

        res.status(201).json(fullRetweet);
    } catch (error) {
        console.error("SERVER ERROR (retweetTweet):", error);
        res.status(500).json({ message: error.message });
    }
};