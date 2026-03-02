import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { User, Message, Notification, sequelize } from '../src/models/index.js';
import jwt from 'jsonwebtoken';

describe('Messaging API', () => {
    let userA, userB, tokenA, tokenB;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        userA = await User.create({ username: 'userA', email: 'a@t.com', password: 'P1!', isVerified: true });
        userB = await User.create({ username: 'userB', email: 'b@t.com', password: 'P1!', isVerified: true });

        const secret = process.env.JWT_SECRET || 'secret';
        tokenA = jwt.sign({ id: userA.id }, secret);
        tokenB = jwt.sign({ id: userB.id }, secret);
    });

    // --- TEST: SLANJE PORUKE I NOTIFIKACIJA ---

    test('Treba poslati prvu poruku i kreirati notifikaciju za primatelja', async () => {
        const res = await request(app)
            .post('/api/message/send')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({
                recipientId: userB.id,
                content: 'Bok, ovo je prva poruka!'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.content).toBe('Bok, ovo je prva poruka!');
        expect(res.body.Sender.username).toBe('userA');

        // Provjera notifikacije (budući da je ovo prva poruka ikada)
        const notif = await Notification.findOne({
            where: { recipientId: userB.id, senderId: userA.id, type: 'message' }
        });
        expect(notif).not.toBeNull();
    });

    test('Druga poruka ne bi smjela kreirati novu notifikaciju', async () => {
        // UserA šalje još jednu poruku
        await request(app)
            .post('/api/message/send')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ recipientId: userB.id, content: 'Druga poruka' });

        // Brojimo notifikacije tipa 'message' za userB od userA
        const count = await Notification.count({
            where: { recipientId: userB.id, senderId: userA.id, type: 'message' }
        });
        
        // I dalje treba biti samo 1 (ona od prve poruke)
        expect(count).toBe(1);
    });

    // --- TEST: DOHVAT CHATA ---

    test('Treba dohvatiti cijeli chat između dva korisnika', async () => {
        const res = await request(app)
            .get(`/api/message/${userB.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
        expect(res.body[0]).toHaveProperty('content');
    });

    // --- TEST: LISTA KONVERZACIJA ---

    test('Treba dohvatiti listu svih konverzacija korisnika', async () => {
        const res = await request(app)
            .get('/api/message/conversations')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        // Provjeravamo da li se u porukama vidi i Sender i Recipient asocijacija
        expect(res.body[0]).toHaveProperty('Sender');
        expect(res.body[0]).toHaveProperty('Recipient');
    });

    // --- TEST: OZNAČAVANJE PROČITANIM ---

    test('Treba označiti poruke od određenog pošiljatelja kao pročitane', async () => {
        // UserB označava poruke od UserA kao pročitane
        const res = await request(app)
            .put(`/api/message/read/${userA.id}`)
            .set('Authorization', `Bearer ${tokenB}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Poruke označene kao pročitane");

        // Provjera u bazi
        const unreadCount = await Message.count({
            where: { senderId: userA.id, recipientId: userB.id, isRead: false }
        });
        expect(unreadCount).toBe(0);
    });

    // --- TEST: VALIDACIJA ---

    test('Vraća 400 ako nedostaje sadržaj ili primatelj', async () => {
        const res = await request(app)
            .post('/api/message/send')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ content: '' });

        expect(res.statusCode).toBe(400);
    });
});