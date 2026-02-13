import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  type: {
    type: DataTypes.ENUM('like', 'comment', 'follow', 'new_tweet'),
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: true 
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tweetId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

export default Notification;