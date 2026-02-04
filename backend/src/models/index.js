import User from './User.js';
import Tweet from './Tweet.js';
import Comment from './Comment.js';
import Notification from './Notification.js';

// --- Relacije ---

// User & Tweet
User.hasMany(Tweet, { foreignKey: 'userId', onDelete: 'CASCADE' });
Tweet.belongsTo(User, { foreignKey: 'userId' });

// Follow sustav (N:M)
User.belongsToMany(User, { as: 'Followers', foreignKey: 'followingId', through: 'Follows' });
User.belongsToMany(User, { as: 'Following', foreignKey: 'followerId', through: 'Follows' });

// Likes (N:M)
Tweet.belongsToMany(User, { through: 'Likes', as: 'LikedBy' });
User.belongsToMany(Tweet, { through: 'Likes', as: 'LikedTweets' });

// Comments (1:N)
Comment.belongsTo(Tweet, { foreignKey: 'tweetId' });
User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// Notifications
User.hasMany(Notification, { as: 'Notifications', foreignKey: 'recipientId' });
Notification.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });


//Deleting
Tweet.hasMany(Comment, { foreignKey: 'tweetId', onDelete: 'CASCADE' });
User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });

export { User, Tweet, Comment, Notification };