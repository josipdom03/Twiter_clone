import sequelize from '../config/database.js';
import User from './User.js';
import Tweet from './Tweet.js';
import Comment from './Comment.js';
import Notification from './Notification.js';
import Message from './Message.js';
import FollowRequest from './FollowRequest.js';
import Follow from './Follow.js';

// --- USER & TWEET ---
User.hasMany(Tweet, { foreignKey: 'userId', onDelete: 'CASCADE' });
Tweet.belongsTo(User, { foreignKey: 'userId' });

// --- RETWEET SUSTAV (Self-association) ---
// constraints: false je ključan ovdje da izbjegnemo "Key column 'parentId' doesn't exist"
Tweet.belongsTo(Tweet, { as: 'ParentTweet', foreignKey: 'parentId', constraints: false });
Tweet.hasMany(Tweet, { as: 'Retweets', foreignKey: 'parentId', constraints: false });

// --- TWEET LIKES (Many-to-Many) ---
Tweet.belongsToMany(User, { 
    through: 'TweetLikes', 
    as: 'LikedByUsers', 
    foreignKey: 'tweet_id', 
    otherKey: 'user_id',
    onDelete: 'CASCADE'
});
User.belongsToMany(Tweet, { 
    through: 'TweetLikes', 
    as: 'LikedTweets', 
    foreignKey: 'user_id', 
    otherKey: 'tweet_id',
    onDelete: 'CASCADE'
});

// --- FOLLOW SUSTAV ---
User.belongsToMany(User, { 
    as: 'Followers', 
    through: Follow, 
    foreignKey: 'following_id',
    otherKey: 'follower_id'
});
User.belongsToMany(User, { 
    as: 'Following', 
    through: Follow, 
    foreignKey: 'follower_id', 
    otherKey: 'following_id'
});

User.hasMany(Follow, { foreignKey: 'following_id', as: 'SubscriptionSettings' });
Follow.belongsTo(User, { foreignKey: 'follower_id', as: 'Follower' });
Follow.belongsTo(User, { foreignKey: 'following_id', as: 'Target' });

// --- COMMENTS ---
Tweet.hasMany(Comment, { foreignKey: 'tweetId', onDelete: 'CASCADE' });
Comment.belongsTo(Tweet, { foreignKey: 'tweetId', as: 'TargetTweet' });

User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// --- COMMENT LIKES (Many-to-Many) ---
Comment.belongsToMany(User, { 
    through: 'CommentLikes', 
    as: 'LikedByUsers', 
    foreignKey: 'comment_id', 
    otherKey: 'user_id',
    onDelete: 'CASCADE'
});
User.belongsToMany(Comment, { 
    through: 'CommentLikes', 
    as: 'LikedComments', 
    foreignKey: 'user_id', 
    otherKey: 'comment_id',
    onDelete: 'CASCADE'
});

// --- NOTIFICATIONS ---
User.hasMany(Notification, { as: 'Notifications', foreignKey: 'recipientId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { as: 'Recipient', foreignKey: 'recipientId' });
Notification.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });

// Notification asocijacije prema Tweetovima i Komentarima
Notification.belongsTo(Tweet, { foreignKey: 'tweetId', as: 'Tweet', constraints: false });
Tweet.hasMany(Notification, { foreignKey: 'tweetId', constraints: false });

Notification.belongsTo(Comment, { foreignKey: 'commentId', as: 'Comment', constraints: false });
Comment.hasMany(Notification, { foreignKey: 'commentId', constraints: false });

// --- MESSAGES ---
User.hasMany(Message, { as: 'SentMessages', foreignKey: 'senderId', onDelete: 'CASCADE' });
User.hasMany(Message, { as: 'ReceivedMessages', foreignKey: 'recipientId', onDelete: 'CASCADE' });
Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'Recipient', foreignKey: 'recipientId' });

// --- FOLLOW REQUEST ---
User.hasMany(FollowRequest, { as: 'SentRequests', foreignKey: 'senderId', onDelete: 'CASCADE' });
User.hasMany(FollowRequest, { as: 'ReceivedRequests', foreignKey: 'recipientId', onDelete: 'CASCADE' });
FollowRequest.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
FollowRequest.belongsTo(User, { as: 'Recipient', foreignKey: 'recipientId' });

export { 
    sequelize, 
    User, 
    Tweet, 
    Comment, 
    Notification, 
    Message, 
    FollowRequest, 
    Follow 
};