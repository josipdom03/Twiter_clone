import { Notification, User, Tweet, Comment } from '../models/index.js';

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id; 

        const notifications = await Notification.findAll({
            where: { recipientId: userId },
            include: [
                {
                    model: User,
                    as: 'Sender',
                    attributes: ['id', 'username', 'profilePicture'] 
                },
                {
                    model: Tweet,
                    as: 'Tweet',
                    attributes: ['id', 'content'] 
                },
                {
                    model: Comment,
                    as: 'Comment',
                    attributes: ['id', 'content']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Greška pri dohvaćanju notifikacija', error: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [updatedRows] = await Notification.update(
            { isRead: true },
            { where: { id, recipientId: userId } }
        );

        if (updatedRows === 0) {
            return res.status(404).json({ message: 'Notifikacija nije pronađena ili je već pročitana' });
        }

        res.status(200).json({ message: 'Notifikacija označena kao pročitana' });
    } catch (error) {
        res.status(500).json({ message: 'Greška pri ažuriranju notifikacije', error: error.message });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await Notification.update(
            { isRead: true },
            { where: { recipientId: userId, isRead: false } }
        );
        
        res.status(200).json({ message: 'Sve notifikacije označene kao pročitane' });
    } catch (error) {
        res.status(500).json({ message: 'Greška pri ažuriranju', error: error.message });
    }
};