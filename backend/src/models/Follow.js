import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Follow = sequelize.define('Follow', {
    follower_id: { type: DataTypes.INTEGER, primaryKey: true },
    following_id: { type: DataTypes.INTEGER, primaryKey: true },
    notify: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false // Standardno je zvonce isključeno
    }
}, { timestamps: true });

export default Follow;