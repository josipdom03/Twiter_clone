import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { User, Tweet, Comment, sequelize } from '../src/models/index.js';
import jwt from 'jsonwebtoken';

// 1. MOCKANJE vanjskih funkcija
// Pretpostavljamo putanju do kontrolera tweeta gdje se nalazi updateTweetScore
jest.unstable_mockModule('../src/controllers/tweetController.js', () => ({
    updateTweetScore: jest.fn(() => Promise.resolve())
}));

describe('Comment API', () => {
    let testUser, otherUser, testTweet, token, otherToken;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        // Kreiranje korisnika
        testUser = await User.create({
            username: 'komentator',
            email: 'k@test.com',
            password: 'Password123!',
            isVerified: true
        });

        otherUser = await User.create({
            username: 'lajker',
            email: 'l@test.com',
            password: 'Password123!',
            isVerified: true
        });

        // Kreiranje tweeta na koji ćemo lijepiti komentare
        testTweet = await Tweet.create({
            content: 'Originalni tweet',
            userId: testUser.id
        });

        const secret = process.env.JWT_SECRET || 'secret';
        token = jwt.sign({ id: testUser.id }, secret);
        otherToken = jwt.sign({ id: otherUser.id }, secret);
    });

    // --- TEST KREIRANJA KOMENTARA ---

    test('Treba uspješno kreirati komentar na tweet', async () => {
        const res = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                content: 'Ovo je testni komentar',
                tweetId: testTweet.id
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.content).toBe('Ovo je testni komentar');
        expect(res.body.User.username).toBe('komentator');
        expect(res.body.tweetId).toBe(testTweet.id);
    });

    test('Ne bi smio kreirati komentar bez autorizacije', async () => {
        const res = await request(app)
            .post('/api/comments')
            .send({ content: 'Nevaljali komentar', tweetId: testTweet.id });

        expect(res.statusCode).toBe(401);
    });

    // --- TEST LAJKOVA NA KOMENTARU ---

    test('Treba dohvatiti listu korisnika koji su lajkali komentar', async () => {
        // 1. Prvo ručno kreiramo komentar
        const comment = await Comment.create({
            content: 'Lajkajte me',
            tweetId: testTweet.id,
            userId: testUser.id
        });

        // 2. Dodamo lajk od otherUser (preko pivot tablice LikedByUsers)
        await comment.addLikedByUsers(otherUser);

        // 3. Dohvaćamo listu lajkova (Auth je optional, pa testiramo s tokenom)
        const res = await request(app)
            .get(`/api/comments/${comment.id}/likes`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].username).toBe('lajker');
        // Provjera isFollowing polja (Komentator ne prati Lajkera još)
        expect(res.body[0].isFollowing).toBe(false);
    });

    test('Treba ispravno prikazati isFollowing: true ako pratimo lajkera', async () => {
        const comment = await Comment.create({
            content: 'Drugi komentar',
            tweetId: testTweet.id,
            userId: testUser.id
        });

        await comment.addLikedByUsers(otherUser);

        // Korisnik (testUser) zaprati Lajkera (otherUser)
        // Koristimo tvoju Follow tablicu direktno za testni setup
        const { Follow } = await import('../src/models/index.js');
        await Follow.create({
            follower_id: testUser.id,
            following_id: otherUser.id
        });

        const res = await request(app)
            .get(`/api/comments/${comment.id}/likes`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body[0].isFollowing).toBe(true);
    });

    test('Vraća 404 za nepostojeći komentar', async () => {
        const res = await request(app)
            .get('/api/comments/999999/likes');

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Komentar nije pronađen');
    });
});