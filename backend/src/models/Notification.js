import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  type: {
    type: DataTypes.ENUM('like', 'follow', 'comment_like', 'retweet', 'message'),
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read' 
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'recipient_id' 
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sender_id' 
  },
  tweetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'tweet_id'
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'comment_id'
  }
}, {
  underscored: true, // Automatski tretira createdAt kao created_at
  tableName: 'notifications'
});


export default Notification;