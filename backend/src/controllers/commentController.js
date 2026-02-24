import { Comment, User, Follow } from '../models/index.js';
// Uvozi updateTweetScore iz tweetController-a
import { updateTweetScore } from './tweetController.js';

export const createComment = async (req, res) => {
  try {
    const { content, tweetId } = req.body;
    const userId = req.user.id; 

    const newComment = await Comment.create({
      content,
      tweetId,
      userId
    });

    // NADOGRADNJA: Ažuriraj score tweeta jer je dobio novi komentar
    if (tweetId) {
      await updateTweetScore(tweetId);
    }

    const commentWithUser = await Comment.findByPk(newComment.id, {
      include: [{ model: User, attributes: ['id', 'username', 'displayName', 'avatar'] }]
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCommentLikes = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user ? req.user.id : null;

        const comment = await Comment.findByPk(id, {
            include: [{
                model: User,
                as: 'LikedByUsers',
                attributes: ['id', 'username', 'displayName', 'avatar'],
                through: { attributes: [] }
            }]
        });

        if (!comment) {
            return res.status(404).json({ message: "Komentar nije pronađen" });
        }

        const likedByUsers = comment.LikedByUsers || [];

        const likes = await Promise.all(likedByUsers.map(async (user) => {
            let isFollowing = false;
            
            if (currentUserId && currentUserId !== user.id) {
                const follow = await Follow.findOne({
                    where: { 
                        follower_id: currentUserId, 
                        following_id: user.id 
                    }
                });
                isFollowing = !!follow;
            }
            
            return { 
                ...user.get({ plain: true }), 
                isFollowing 
            };
        }));

        res.json(likes);
    } catch (error) {
        console.error("Greška u getCommentLikes:", error);
        res.status(500).json({ error: error.message });
    }
};