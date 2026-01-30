import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  displayName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Twitter "handle" (npr. @mate123)
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 30] // Minimalno 3 znaka
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Ostaje true zbog Google Logina
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
}, {
  underscored: true, 
  timestamps: true
});

export default User;