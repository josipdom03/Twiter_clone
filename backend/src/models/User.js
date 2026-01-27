import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true 
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isVerified: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
  },
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  }


});

export default User;