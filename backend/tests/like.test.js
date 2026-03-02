import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { User, Tweet, Comment, Notification, sequelize } from '../src/models/index.js';
import jwt from 'jsonwebtoken';

// 1. MOCKANJE updateTweetScore funkcije
jest.unstable_mockModule('../src/controllers/tweetController.js', () => ({
    updateTweetScore: jest.fn(() => Promise.resolve())
}));

describe('Like API (Tweets & Comments)', () => {
    let userA, userB, testTweet, testComment, tokenA, tokenB;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        // Kreiranje korisnika
        userA = await User.create({ username: 'userA', email: 'a@t.com', password: 'Password123!', isVerified: true });
        userB = await User.create({ username: 'userB', email: 'b@t.com', password: 'Password123!', isVerified: true });

        // Kreiranje tweeta (vlasnik je userB)
        testTweet = await Tweet.create({ content: 'Tweet od korisnika B', userId: userB.id });

        // Kreiranje komentara na taj tweet (vlasnik je userB)
        testComment = await Comment.create({ content: 'Komentar od korisnika B', tweetId: testTweet.id, userId: userB.id });

        const secret = process.env.JWT_SECRET || 'secret';
        tokenA = jwt.sign({ id: userA.id }, secret);
        tokenB = jwt.sign({ id: userB.id }, secret);
    });

    // --- TESTOVI ZA TWEET LIKE ---

    test('UserA treba moći lajkati tweet od UserB', async () => {
        const res = await request(app)
            .post(`/api/likes/tweet/${testTweet.id}/like`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.liked).toBe(true);

        // Provjera notifikacije u bazi
        const notif = await Notification.findOne({
            where: { tweetId: testTweet.id, recipientId: userB.id, type: 'like' }
        });
        expect(notif).not.toBeNull();
        expect(notif.senderId).toBe(userA.id);
    });

    test('Ponovni poziv treba maknuti lajk (Toggle)', async () => {
        const res = await request(app)
            .post(`/api/likes/tweet/${testTweet.id}/like`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.liked).toBe(false);
    });

    test('Lajkanje vlastitog tweeta ne bi smjelo stvoriti notifikaciju', async () => {
        // UserB lajka svoj tweet
        await request(app)
            .post(`/api/likes/tweet/${testTweet.id}/like`)
            .set('Authorization', `Bearer ${tokenB}`);

        const notif = await Notification.findOne({
            where: { tweetId: testTweet.id, recipientId: userB.id, senderId: userB.id }
        });
        expect(notif).toBeNull();
    });

    // --- TESTOVI ZA COMMENT LIKE ---

    test('UserA treba moći lajkati komentar od UserB', async () => {
        const res = await request(app)
            .post(`/api/likes/comment/${testComment.id}/like`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.liked).toBe(true);

        // Provjera notifikacije za komentar
        const notif = await Notification.findOne({
            where: { commentId: testComment.id, type: 'comment_like' }
        });
        expect(notif).not.toBeNull();
    });

    test('Micanje lajka s komentara', async () => {
        const res = await request(app)
            .post(`/api/likes/comment/${testComment.id}/like`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.liked).toBe(false);
    });

    // --- TESTOVI ZA GREŠKE ---

    test('Vraća 404 ako tweet ne postoji', async () => {
        const res = await request(app)
            .post('/api/likes/tweet/999999/like')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(404);
    });

    test('Ne bi smio dopustiti lajkanje bez tokena', async () => {
        const res = await request(app)
            .post(`/api/likes/tweet/${testTweet.id}/like`);

        expect(res.statusCode).toBe(401);
    });
});