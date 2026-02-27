import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { User, Tweet, FollowRequest, sequelize } from '../src/models/index.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';

describe('User API (Profile & Search)', () => {
    let testUser, otherUser, token;

    beforeAll(async () => {
        // Sinkronizacija baze i kreiranje testnih korisnika
        await sequelize.sync({ force: true });

        testUser = await User.create({
            username: 'glavni',
            email: 'glavni@test.com',
            password: 'Password123!',
            displayName: 'Glavni Lik',
            isVerified: true
        });

        otherUser = await User.create({
            username: 'drugi',
            email: 'drugi@test.com',
            password: 'Password123!',
            displayName: 'Drugi Korisnik',
            isVerified: true,
            isPrivate: true // Privatni profil za testiranje privatnosti
        });

        // Generiramo token za glavnog korisnika
        token = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET || 'secret');
    });

    // 1. DOHVAT VLASTITOG PROFILA
    test('Treba dohvatiti profil ulogiranog korisnika', async () => {
        const res = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.username).toBe(testUser.username);
        expect(res.body).toHaveProperty('followersCount');
        expect(res.body).not.toHaveProperty('password');
    });

    // 2. AŽURIRANJE PROFILA
    test('Treba ažurirati bio i displayName', async () => {
        const res = await request(app)
            .put('/api/users/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({
                bio: 'Novi bio test',
                displayName: 'Updateano Ime',
                isPrivate: 'true'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.bio).toBe('Novi bio test');
        expect(res.body.displayName).toBe('Updateano Ime');
        expect(res.body.isPrivate).toBe(true);
    });

    // 3. DOHVAT DRUGOG KORISNIKA (Privatnost)
    test('Ne bi smio vidjeti tweetove privatnog korisnika kojeg ne prati', async () => {
        // Kreiramo tweet za drugog korisnika
        await Tweet.create({ content: 'Tajni tweet', userId: otherUser.id });

        const res = await request(app)
            .get(`/api/users/u/${otherUser.username}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.isLocked).toBe(true);
        expect(res.body.Tweets).toHaveLength(0);
    });

    // 4. PRETRAGA KORISNIKA
    test('Treba pronaći korisnika putem search queryja', async () => {
        const res = await request(app)
            .get('/api/users/search?query=drugi')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.type).toBe('users');
        expect(res.body.data.some(u => u.username === 'drugi')).toBe(true);
    });

    

    // 5. UPDATE PROFILA S SLIKOM (Multer test)
    test('Treba uploadati avatar (Mocking file)', async () => {
        // Kreiramo privremenu datoteku za test
        const testFilePath = './test-avatar.png';
        fs.writeFileSync(testFilePath, 'fake-image-content');

        const res = await request(app)
            .put('/api/users/profile')
            .set('Authorization', `Bearer ${token}`)
            .attach('avatar', testFilePath); // Supertest attach simulira upload datoteke

        expect(res.statusCode).toBe(200);
        expect(res.body.avatar).toContain('uploads/user-');

        // Očistimo testnu datoteku
        fs.unlinkSync(testFilePath);
    });

    // 6. GREŠKA - ZAUZETO KORISNIČKO IME
    test('Treba javiti grešku ako je username zauzet', async () => {
        const res = await request(app)
            .put('/api/users/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ username: 'drugi' }); // 'drugi' već postoji

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Korisničko ime je već zauzeto');
    });
});