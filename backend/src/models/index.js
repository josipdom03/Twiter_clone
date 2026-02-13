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
Tweet.belongsTo(Tweet, { as: 'ParentTweet', foreignKey: 'parentId' });
Tweet.hasMany(Tweet, { as: 'Retweets', foreignKey: 'parentId' });

// --- TWEET LIKES ---
Tweet.belongsToMany(User, { through: 'TweetLikes', as: 'LikedByUsers', foreignKey: 'tweet_id', otherKey: 'user_id' });
User.belongsToMany(Tweet, { through: 'TweetLikes', as: 'LikedTweets', foreignKey: 'user_id', otherKey: 'tweet_id' });

// --- FOLLOW SUSTAV (Popravljeno i objedinjeno) ---
// Koristimo uvezeni "Follow" model za kroz tablicu (through)
User.belongsToMany(User, { 
    as: 'Followers', 
    through: Follow, 
    foreignKey: 'following_id', // Osoba koja prima follow (cilj)
    otherKey: 'follower_id'      // Osoba koja inicira follow (izvor)
});

User.belongsToMany(User, { 
    as: 'Following', 
    through: Follow, 
    foreignKey: 'follower_id',  // Osoba koja inicira follow (izvor)
    otherKey: 'following_id'    // Osoba koja prima follow (cilj)
});

// Omogućuje direktne upite nad Follow modelom (npr. za notifikacije)
User.hasMany(Follow, { foreignKey: 'following_id', as: 'SubscriptionSettings' });
Follow.belongsTo(User, { foreignKey: 'follower_id', as: 'Follower' });
Follow.belongsTo(User, { foreignKey: 'following_id', as: 'Target' });

// --- COMMENTS ---
Tweet.hasMany(Comment, { foreignKey: 'tweetId', onDelete: 'CASCADE' });
Comment.belongsTo(Tweet, { foreignKey: 'tweetId', as: 'TargetTweet' });
User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// --- COMMENT LIKES ---
Comment.belongsToMany(User, { through: 'CommentLikes', as: 'LikedByUsers', foreignKey: 'comment_id', otherKey: 'user_id' });
User.belongsToMany(Comment, { through: 'CommentLikes', as: 'LikedComments', foreignKey: 'user_id', otherKey: 'comment_id' });

// --- NOTIFICATIONS ---
User.hasMany(Notification, { as: 'Notifications', foreignKey: 'recipientId' });
Notification.belongsTo(User, { as: 'Recipient', foreignKey: 'recipientId' });
Notification.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });

Notification.belongsTo(Tweet, { foreignKey: 'tweetId', as: 'Tweet' });
Tweet.hasMany(Notification, { foreignKey: 'tweetId', onDelete: 'CASCADE' });

Notification.belongsTo(Comment, { foreignKey: 'commentId', as: 'Comment' });
Comment.hasMany(Notification, { foreignKey: 'commentId', onDelete: 'CASCADE' });

// --- MESSAGES ---
User.hasMany(Message, { as: 'SentMessages', foreignKey: 'senderId' });
User.hasMany(Message, { as: 'ReceivedMessages', foreignKey: 'recipientId' });
Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'Recipient', foreignKey: 'recipientId' });

// --- FOLLOW REQUEST ---
User.hasMany(FollowRequest, { as: 'SentRequests', foreignKey: 'senderId' });
User.hasMany(FollowRequest, { as: 'ReceivedRequests', foreignKey: 'recipientId' });
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