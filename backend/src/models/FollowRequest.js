import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FollowRequest = sequelize.define('FollowRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending'
    }
}, { underscored: true });

export default FollowRequest;