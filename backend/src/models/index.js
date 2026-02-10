import sequelize from '../config/database.js';
import User from './User.js';
import Tweet from './Tweet.js';
import Comment from './Comment.js';
import Notification from './Notification.js';
import Message from './Message.js';

// --- USER & TWEET ---
User.hasMany(Tweet, { foreignKey: 'userId', onDelete: 'CASCADE' });
Tweet.belongsTo(User, { foreignKey: 'userId' });

// --- TWEET LIKES ---
Tweet.belongsToMany(User, { through: 'TweetLikes', as: 'LikedByUsers', foreignKey: 'tweet_id', otherKey: 'user_id' });
User.belongsToMany(Tweet, { through: 'TweetLikes', as: 'LikedTweets', foreignKey: 'user_id', otherKey: 'tweet_id' });

// --- FOLLOW SUSTAV ---
// foreignKey je onaj koji je zapraćen, otherKey je onaj koji prati
User.belongsToMany(User, { 
    as: 'Followers', 
    through: 'Follows', 
    foreignKey: 'following_id', 
    otherKey: 'follower_id' 
});
User.belongsToMany(User, { 
    as: 'Following', 
    through: 'Follows', 
    foreignKey: 'follower_id', 
    otherKey: 'following_id' 
});

// --- COMMENTS ---
Tweet.hasMany(Comment, { foreignKey: 'tweetId', onDelete: 'CASCADE' });
Comment.belongsTo(Tweet, { foreignKey: 'tweetId' });
User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// --- COMMENT LIKES ---
Comment.belongsToMany(User, { through: 'CommentLikes', as: 'LikedByUsers', foreignKey: 'comment_id', otherKey: 'user_id' });
User.belongsToMany(Comment, { through: 'CommentLikes', as: 'LikedComments', foreignKey: 'user_id', otherKey: 'comment_id' });

// --- NOTIFICATIONS & MESSAGES ---
User.hasMany(Notification, { as: 'Notifications', foreignKey: 'recipientId' });
Notification.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
User.hasMany(Message, { as: 'SentMessages', foreignKey: 'senderId' });
User.hasMany(Message, { as: 'ReceivedMessages', foreignKey: 'recipientId' });
Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'Recipient', foreignKey: 'recipientId' });

export { sequelize, User, Tweet, Comment, Notification, Message };