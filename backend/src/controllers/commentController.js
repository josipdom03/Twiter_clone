import { Comment, User } from '../models/index.js';

export const createComment = async (req, res) => {
  try {
    const { content, tweetId } = req.body;
    const userId = req.user.id; 

    const newComment = await Comment.create({
      content,
      tweetId,
      userId
    });

    // Vrati komentar zajedno s podacima o autoru da frontend može odmah prikazati ime
    const commentWithUser = await Comment.findByPk(newComment.id, {
      include: [{ model: User, attributes: ['username', 'displayName', 'avatar'] }]
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};