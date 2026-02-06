import { Message, User } from '../models/index.js';
import { Op } from 'sequelize';

// 1. Pošalji poruku
export const sendMessage = async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user.id;

        const message = await Message.create({
            senderId,
            recipientId,
            content
        });

        // OVDJE ĆE IĆI SOCKET.IO KASNIJE (da poruka stigne instant)

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Greška pri slanju poruke' });
    }
};

// 2. Dohvati konverzaciju s određenim korisnikom
export const getChat = async (req, res) => {
    try {
        const { userId } = req.params; // ID osobe s kojom se dopisujemo
        const myId = req.user.id;

        const chat = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: myId, recipientId: userId },
                    { senderId: userId, recipientId: myId }
                ]
            },
            order: [['createdAt', 'ASC']]
        });

        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: 'Greška pri dohvaćanju chata' });
    }
};