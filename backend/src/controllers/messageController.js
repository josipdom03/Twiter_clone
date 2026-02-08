import { Message, User } from '../models/index.js';
import { Op } from 'sequelize';

// 1. Pošalji poruku
export const sendMessage = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user.id;

        if (!content || !recipientId) {
            return res.status(400).json({ message: 'Nedostaju primatelj ili sadržaj poruke' });
        }

        const message = await Message.create({
            senderId,
            recipientId,
            content
        });

        const fullMessage = await Message.findByPk(message.id, {
            include: [
                { 
                    model: User, 
                    as: 'Sender', 
                    attributes: ['id', 'username', 'displayName', 'avatar'] 
                }
            ]
        });

        if (req.io) {
            // Šaljemo u sobu primatelja i u sobu pošiljatelja
            req.io.to(`user_${recipientId}`).emit('receive_message', fullMessage);
            req.io.to(`user_${senderId}`).emit('receive_message', fullMessage);
        }

        res.status(201).json(fullMessage);
    } catch (error) {
        console.error("Greška u sendMessage:", error);
        res.status(500).json({ message: 'Greška pri slanju poruke' });
    }
};

// 2. Dohvati konverzaciju s određenim korisnikom
export const getChat = async (req, res) => {
    try {
        const { userId } = req.params; 
        const myId = req.user.id;

        const chat = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: myId, recipientId: userId },
                    { senderId: userId, recipientId: myId }
                ]
            },
            include: [
                { 
                    model: User, 
                    as: 'Sender', 
                    attributes: ['id', 'username', 'displayName', 'avatar'] 
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.json(chat);
    } catch (error) {
        console.error("Greška u getChat:", error);
        res.status(500).json({ message: 'Greška pri dohvaćanju chata' });
    }
};

// 3. Dohvati sve konverzacije
export const getConversations = async (req, res) => {
    try {
        const myId = req.user.id;
        
        const messages = await Message.findAll({
            where: {
                [Op.or]: [{ senderId: myId }, { recipientId: myId }]
            },
            include: [
                { model: User, as: 'Sender', attributes: ['id', 'username', 'displayName', 'avatar'] },
                { model: User, as: 'Recipient', attributes: ['id', 'username', 'displayName', 'avatar'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(messages);
    } catch (error) {
        console.error("Greška u getConversations:", error);
        res.status(500).json({ message: 'Greška pri dohvaćanju konverzacija' });
    }
};