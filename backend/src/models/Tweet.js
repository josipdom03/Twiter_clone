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
    },
    // Polje za pohranu score-a, koji će se računati i ažurirati periodično
    score: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'tweets', 
    // Indekse je najsigurnije maknuti iz samog modela dok se baza ne inicijalizira.
    // Sequelize će automatski indeksirati Foreign Key polja kroz asocijacije.
    indexes: [] 
});

Tweet.prototype.calculateScore = function() {
    // Ponderi za važnost interakcije
    const weightLikes = 2;
    const weightRetweets = 5;
    const weightComments = 1;
    
    // Dohvaćamo brojeve (ovisi kako su ti asocijacije učitane)
    const likes = this.LikedByUsers ? this.LikedByUsers.length : 0;
    const comments = this.Comments ? this.Comments.length : 0;
    const retweets = this.retweetCount || 0;

    // Vremensko kvarenje (Gravity) - stariji tweetovi gube score
    const hoursSinceCreated = (Date.now() - new Date(this.createdAt).getTime()) / (1000 * 60 * 60);
    const gravity = 1.8;

    const baseScore = (likes * weightLikes) + (retweets * weightRetweets) + (comments * weightComments);
    
    // Formula: Score / (Vrijeme + 2)^Gravity
    return baseScore / Math.pow(hoursSinceCreated + 2, gravity);
};

export default Tweet;