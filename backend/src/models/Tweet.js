import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Tweet = sequelize.define('Tweet', {
    content: {
        type: DataTypes.STRING(280),
        allowNull: true 
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    images: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
    },
    // Čisto polje, bez 'references' ovdje kako bi izbjegli kružne greške
    parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'tweets', 
    // Indekse je najsigurnije maknuti iz samog modela dok se baza ne inicijalizira.
    // Sequelize će automatski indeksirati Foreign Key polja kroz asocijacije.
    indexes: [] 
});

export default Tweet;