import { Tweet, Comment, User, Notification } from '../models/index.js';

// Toggle lajk za Tweet
export const toggleTweetLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id; 

        const tweet = await Tweet.findByPk(id);
        if (!tweet) return res.status(404).json({ message: "Objava nije pronađena" });

        const hasLiked = await tweet.hasLikedByUsers(userId);
        
        if (hasLiked) {
            await tweet.removeLikedByUsers(userId);
            return res.json({ liked: false });
        } else {
            await tweet.addLikedByUsers(userId);

            if (tweet.userId !== userId) {
                const [notification, created] = await Notification.findOrCreate({
                    where: {
                        type: 'like',
                        tweetId: id,
                        recipientId: tweet.userId
                    },
                    defaults: {
                        senderId: userId, // Prvi koji je pokrenuo obavijest
                        isRead: false
                    }
                });

                if (!created) {
                    await notification.update({
                        isRead: false,
                        senderId: userId, 
                        updatedAt: new Date() 
                    });
                }
            }

            return res.json({ liked: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const toggleCommentLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findByPk(id);
        if (!comment) return res.status(404).json({ message: "Komentar nije pronađen" });

        const hasLiked = await comment.hasLikedByUsers(userId);
        
        if (hasLiked) {
            await comment.removeLikedByUsers(userId);
            return res.json({ liked: false });
        } else {
            await comment.addLikedByUsers(userId);

            if (comment.userId !== userId) {
                const [notification, created] = await Notification.findOrCreate({
                    where: {
                        type: 'comment_like', 
                        commentId: id,
                        recipientId: comment.userId
                    },
                    defaults: {
                        senderId: userId,
                        isRead: false
                    }
                });

                if (!created) {
                    await notification.update({
                        isRead: false,
                        senderId: userId,
                        updatedAt: new Date()
                    });
                }
            }

            return res.json({ liked: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};