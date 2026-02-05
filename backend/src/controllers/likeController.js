import { Tweet, Comment, User } from '../models/index.js';

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
            return res.json({ liked: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Toggle lajk za Komentar
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
            return res.json({ liked: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};