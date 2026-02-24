import { Tweet, Comment, User, Notification } from '../models/index.js';
// Pretpostavljam da je tvoj tweet kontroler u istoj mapi. 
// Obavezno dodaj "export" ispred "const updateTweetScore" u tweetController.js
import { updateTweetScore } from './tweetController.js'; 

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
            
            // NADOGRADNJA: Ažuriraj score nakon micanja lajka
            await updateTweetScore(id);

            return res.json({ liked: false });
        } else {
            await tweet.addLikedByUsers(userId);

            // NADOGRADNJA: Ažuriraj score nakon dodavanja lajka
            await updateTweetScore(id);

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
            
            // NADOGRADNJA: Ako komentar utječe na score parent tweeta (prema tvojoj formuli u updateTweetScore),
            // ažuriramo score tweeta kojem komentar pripada.
            if (comment.tweetId) {
                await updateTweetScore(comment.tweetId);
            }

            return res.json({ liked: false });
        } else {
            await comment.addLikedByUsers(userId);

            // NADOGRADNJA: Ažuriranje score-a tweeta zbog nove interakcije na komentaru
            if (comment.tweetId) {
                await updateTweetScore(comment.tweetId);
            }

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