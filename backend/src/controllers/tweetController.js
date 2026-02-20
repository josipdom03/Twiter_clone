import { Tweet, User, Comment, Notification, sequelize } from '../models/index.js';
import { Op, fn, col } from 'sequelize';

export const getAllTweets = async (req, res) => {
    try {
        const currentUserId = req.user ? req.user.id : 0;
        
        // Parametri za paginaciju
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        console.log(`Dohvaćam tweets - page: ${page}, limit: ${limit}, offset: ${offset}`);

        // Prvo izbroji ukupno tweetova
        const totalTweets = await Tweet.count();

        // Dohvati samo jednu stranicu
        const tweets = await Tweet.findAll({
            include: [
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
                    model: User,
                    as: 'LikedByUsers',
                    attributes: ['id'],
                    through: { attributes: [] }
                },
                {
                    model: Comment,
                    attributes: ['id']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset
        });

        const totalPages = Math.ceil(totalTweets / limit);

        console.log(`Vraćam ${tweets.length} tweetova od ukupno ${totalTweets}, stranica ${page}/${totalPages}`);

        // Vrati objekt s paginacijom
        res.json({
            tweets: tweets,
            totalPages: totalPages,
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
        const { content, image } = req.body;
        const authorId = req.user.id;

        const newTweet = await Tweet.create({
            content,
            image,
            userId: authorId
        });

        // --- OBAVIJESTI PRATITELJIMA ---
        try {
            // Pronađi sve koji prate autora i imaju upaljeno zvonce (notify: true)
            const subscribers = await sequelize.query(
                `SELECT follower_id FROM follows WHERE following_id = :authorId AND notify = true`,
                {
                    replacements: { authorId },
                    type: sequelize.QueryTypes.SELECT
                }
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
            // Ne bacamo 500 grešku ovdje jer je tweet već uspješno kreiran
        }
        // ------------------------------

        if (req.io) {
            req.io.emit('new_tweet', newTweet);
        }

        res.status(201).json({
            ...newTweet.toJSON(),
            LikedByUsers: [],
            Comments: []
        });
    } catch (error) {
        console.error("SERVER ERROR (createTweet):", error);
        res.status(500).json({ message: error.message });
    }
};

export const getTweetById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user ? req.user.id : 0;

        const tweet = await Tweet.findByPk(id, {
            include: [
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
                    model: User,
                    as: 'LikedByUsers',
                    attributes: [
                        'id', 'username', 'displayName', 'avatar',
                        [
                            sequelize.literal(`EXISTS(SELECT 1 FROM follows WHERE follower_id = ${Number(currentUserId)} AND following_id = \`LikedByUsers\`.\`id\`)`),
                            'isFollowing'
                        ]
                    ],
                    through: { attributes: [] }
                },
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
            return res.status(403).json({ message: "Nemate dopuštenje za brisanje tuđeg tweeta" });
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
                createdAt: { [Op.gte]: tenDaysAgo }
            },
            attributes: ['content']
        });

        const hashtagCounts = {};
        recentTweets.forEach(tweet => {
            const hashtags = tweet.content.match(/#[a-z0-9_]+/gi);
            if (hashtags) {
                hashtags.forEach(tag => {
                    const cleanTag = tag.toLowerCase();
                    hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
                });
            }
        });

        // Pretvori u niz, sortiraj i uzmi top 20
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