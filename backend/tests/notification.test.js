import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { User, Tweet, Notification, sequelize } from '../src/models/index.js';
import jwt from 'jsonwebtoken';

describe('Notification API', () => {
    let userA, userB, tokenA, tokenB, testTweet;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        // Kreiranje korisnika
        userA = await User.create({ username: 'primatelj', email: 'a@t.com', password: 'P1!', isVerified: true });
        userB = await User.create({ username: 'posiljatelj', email: 'b@t.com', password: 'P1!', isVerified: true });

        // Tweet koji će biti vezan uz notifikaciju
        testTweet = await Tweet.create({ content: 'Neki tweet', userId: userA.id });

        const secret = process.env.JWT_SECRET || 'secret';
        tokenA = jwt.sign({ id: userA.id }, secret);
        tokenB = jwt.sign({ id: userB.id }, secret);

        // Kreiramo par testnih notifikacija za userA
        await Notification.bulkCreate([
            { type: 'like', recipientId: userA.id, senderId: userB.id, tweetId: testTweet.id, isRead: false },
            { type: 'follow', recipientId: userA.id, senderId: userB.id, isRead: false }
        ]);
    });

    // --- TEST: DOHVAT NOTIFIKACIJA ---

    test('Treba dohvatiti sve notifikacije za ulogiranog korisnika', async () => {
        const res = await request(app)
            .get('/api/notifications')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0]).toHaveProperty('Sender');
        expect(res.body[0].Sender.username).toBe('posiljatelj');
    });

    // --- TEST: OZNAČAVANJE KAO PROČITANO ---

    test('Treba označiti pojedinačnu notifikaciju kao pročitanu', async () => {
        const notif = await Notification.findOne({ where: { recipientId: userA.id } });

        const res = await request(app)
            .post(`/api/notifications/${notif.id}/read`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        
        // Provjera u bazi
        const updatedNotif = await Notification.findByPk(notif.id);
        expect(updatedNotif.isRead).toBe(true);
    });

    test('Ne bi smio moći označiti tuđu notifikaciju kao pročitanu', async () => {
        const notif = await Notification.findOne({ where: { recipientId: userA.id } });

        // UserB pokušava označiti notifikaciju od UserA
        const res = await request(app)
            .post(`/api/notifications/${notif.id}/read`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.statusCode).toBe(404); // Jer kontroler filtrira po recipientId: userId
    });

    // --- TEST: OZNAČI SVE KAO PROČITANO ---

    test('Treba označiti sve nepročitane notifikacije kao pročitane', async () => {
        // Prvo dodamo još jednu nepročitanu
        await Notification.create({ type: 'like', recipientId: userA.id, senderId: userB.id, isRead: false });

        const res = await request(app)
            .patch('/api/notifications/read-all')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain('Sve notifikacije');

        // Provjera u bazi - nijedna ne smije biti isRead: false za userA
        const unreadCount = await Notification.count({ where: { recipientId: userA.id, isRead: false } });
        expect(unreadCount).toBe(0);
    });

    // --- TEST: GREŠKE ---

    test('Vraća 401 ako korisnik nije ulogiran', async () => {
        const res = await request(app).get('/api/notifications');
        expect(res.statusCode).toBe(401);
    });
});