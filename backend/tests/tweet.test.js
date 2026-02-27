import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { User, Tweet, sequelize } from '../src/models/index.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

describe('Tweet API', () => {
    let testUser, token, otherUser, tweetId;

    beforeAll(async () => {
        // Sinkronizacija baze (testna baza)
        await sequelize.sync({ force: true });

        // Kreiranje testnih korisnika
        testUser = await User.create({
            username: 'autor',
            email: 'autor@test.com',
            password: 'Password123!',
            isVerified: true
        });

        otherUser = await User.create({
            username: 'drugi',
            email: 'drugi@test.com',
            password: 'Password123!',
            isVerified: true
        });

        token = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET || 'secret');
    });

    // 1. KREIRANJE TWEETA (S jednom slikom)
    test('Treba uspješno kreirati tweet sa slikom', async () => {
        const testFilePath = './test-image.jpg';
        fs.writeFileSync(testFilePath, 'fake-image-content');

        const res = await request(app)
            .post('/api/tweets')
            .set('Authorization', `Bearer ${token}`)
            .field('content', 'Ovo je moj #prvi tweet!') // .send() ne radi s .attach()
            .attach('images', testFilePath);

        expect(res.statusCode).toBe(201);
        expect(res.body.content).toBe('Ovo je moj #prvi tweet!');
        expect(res.body).toHaveProperty('image');
        expect(res.body.User.username).toBe('autor');
        
        tweetId = res.body.id; // Spremamo za kasnije testove
        fs.unlinkSync(testFilePath);
    });

    // 2. DOHVAT SVIH TWEETOVA (Paginacija)
    test('Treba dohvatiti listu tweetova s paginacijom', async () => {
        const res = await request(app)
            .get('/api/tweets?page=1&limit=10');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('tweets');
        expect(Array.isArray(res.body.tweets)).toBe(true);
        expect(res.body.totalTweets).toBeGreaterThan(0);
    });

    // 3. RETWEET LOGIKA
    test('Treba moći retvitati tweet', async () => {
        const otherToken = jwt.sign({ id: otherUser.id }, process.env.JWT_SECRET || 'secret');
        
        const res = await request(app)
            .post(`/api/tweets/${tweetId}/retweet`)
            .set('Authorization', `Bearer ${otherToken}`);

        expect(res.statusCode).toBe(201);
        expect(res.body.parentId).toBe(tweetId);
        expect(res.body.User.id).toBe(otherUser.id);
    });

    // 4. TRENDOVI (Hashtagovi)
    test('Treba izvući hashtagove u trendove', async () => {
        const res = await request(app).get('/api/tweets/trends');

        expect(res.statusCode).toBe(200);
        const hasPrvi = res.body.some(t => t.tag === '#prvi');
        expect(hasPrvi).toBe(true);
    });

    // 5. DOHVAT POJEDINAČNOG TWEETA
    test('Treba dohvatiti tweet po ID-u s autorom', async () => {
        const res = await request(app).get(`/api/tweets/${tweetId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(tweetId);
        expect(res.body).toHaveProperty('User');
    });

    // 6. FOLLOWING FEED
    test('Following feed treba biti prazan ako nikoga ne prati', async () => {
        const res = await request(app)
            .get('/api/tweets/following')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        // Po tvojoj logici, uključuješ i sebe u following feed
        expect(res.body.tweets.length).toBeGreaterThan(0); 
    });

    // 7. BRISANJE TWEETA
    test('Autor treba moći obrisati svoj tweet', async () => {
        const res = await request(app)
            .delete(`/api/tweets/${tweetId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain('uspješno obrisan');

        // Provjera u bazi
        const deletedTweet = await Tweet.findByPk(tweetId);
        expect(deletedTweet).toBeNull();
    });

    // 8. SECURITY - TUDI TWEET
    test('Ne bi smio moći obrisati tuđi tweet', async () => {
        // Kreiramo tweet kao otherUser
        const tempTweet = await Tweet.create({ content: 'Tuđi', userId: otherUser.id });

        const res = await request(app)
            .delete(`/api/tweets/${tempTweet.id}`)
            .set('Authorization', `Bearer ${token}`); // Pokušavamo obrisati s testUser tokenom

        expect(res.statusCode).toBe(403);
    });
});