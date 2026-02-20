import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Tweet = sequelize.define('Tweet', {
  content: {
    type: DataTypes.STRING(280),
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON, // Čuva niz putanja do slika
    allowNull: true,
    defaultValue: null
}
}, {
  timestamps: true // Automatski dodaje createdAt i updatedAt (bitno za poredak objava)
});

export default Tweet;