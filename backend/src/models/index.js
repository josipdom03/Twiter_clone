import User from './User.js';
import Tweet from './Tweet.js';
import Comment from './Comment.js';
import Notification from './Notification.js';
import Message from './Message.js';

// --- USER & TWEET (1:N) ---
User.hasMany(Tweet, { foreignKey: 'userId', onDelete: 'CASCADE' });
Tweet.belongsTo(User, { foreignKey: 'userId' });

// --- TWEET LIKES (N:M) ---
// Koristimo 'TweetLikes' kao tablicu i 'LikedByUsers' kao alias da odgovara frontendu
Tweet.belongsToMany(User, { through: 'TweetLikes', as: 'LikedByUsers' });
User.belongsToMany(Tweet, { through: 'TweetLikes', as: 'LikedTweets' });

// --- FOLLOW SUSTAV (N:M) ---
User.belongsToMany(User, { as: 'Followers', foreignKey: 'followingId', through: 'Follows' });
User.belongsToMany(User, { as: 'Following', foreignKey: 'followerId', through: 'Follows' });

// --- COMMENTS (1:N) ---
// Tweet ima mnogo komentara
Tweet.hasMany(Comment, { foreignKey: 'tweetId', onDelete: 'CASCADE' });
Comment.belongsTo(Tweet, { foreignKey: 'tweetId' });

// User ima mnogo komentara
User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// --- COMMENT LIKES (N:M) ---
Comment.belongsToMany(User, { through: 'CommentLikes', as: 'LikedByUsers' });
User.belongsToMany(Comment, { through: 'CommentLikes', as: 'LikedComments' });

// --- NOTIFICATIONS (1:N) ---
User.hasMany(Notification, { as: 'Notifications', foreignKey: 'recipientId' });
Notification.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
// --- MESSAGES (1:N) ---
// Korisnik može poslati mnogo poruka
User.hasMany(Message, { as: 'SentMessages', foreignKey: 'senderId' });
// Korisnik može primiti mnogo poruka
User.hasMany(Message, { as: 'ReceivedMessages', foreignKey: 'recipientId' });

Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'Recipient', foreignKey: 'recipientId' });

export { User, Tweet, Comment, Notification,Message };