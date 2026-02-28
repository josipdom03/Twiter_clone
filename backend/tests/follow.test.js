import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { User, FollowRequest, sequelize } from '../src/models/index.js';
import jwt from 'jsonwebtoken';
import { Notification } from '../src/models/index.js';

jest.spyOn(Notification, 'create').mockImplementation(() => Promise.resolve({}));

describe('Follow API (Social Features)', () => {
    let userA, userB, privateUser, tokenA, tokenB, tokenPrivate;

    beforeAll(async () => {
        // Reset baze podataka
        await sequelize.sync({ force: true });

        // 1. Kreiranje testnih korisnika
        userA = await User.create({
            username: 'korisnikA',
            email: 'a@test.com',
            password: 'Password123!',
            isVerified: true
        });

        userB = await User.create({
            username: 'korisnikB',
            email: 'b@test.com',
            password: 'Password123!',
            isVerified: true
        });

        privateUser = await User.create({
            username: 'privatni',
            email: 'p@test.com',
            password: 'Password123!',
            isVerified: true,
            isPrivate: true
        });

        // 2. Generiranje tokena
        const secret = process.env.JWT_SECRET || 'secret';
        tokenA = jwt.sign({ id: userA.id }, secret);
        tokenB = jwt.sign({ id: userB.id }, secret);
        tokenPrivate = jwt.sign({ id: privateUser.id }, secret);
    });

    // --- TESTOVI ZA PRAĆENJE ---

    test('Korisnik A treba moći zapratiti javnog korisnika B', async () => {
        const res = await request(app)
            .post(`/api/follow/${userB.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('following');
        expect(res.body.followersCount).toBe(1);
    });

    test('Korisnik ne bi smio moći pratiti samog sebe', async () => {
        const res = await request(app)
            .post(`/api/follow/${userA.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Ne možete pratiti sami sebe');
    });

    test('Slanje zahtjeva za praćenje privatnom korisniku', async () => {
        const res = await request(app)
            .post(`/api/follow/${privateUser.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('pending');
        expect(res.body.message).toContain('poslan');
    });

    // --- TESTOVI ZA ZAHTJEVE (REQUESTS) ---

    test('Privatni korisnik treba vidjeti listu zahtjeva na čekanju', async () => {
        const res = await request(app)
            .get('/api/follow/requests')
            .set('Authorization', `Bearer ${tokenPrivate}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].Sender.username).toBe('korisnikA');
    });

    test('Privatni korisnik prihvaća zahtjev za praćenje', async () => {
        // Prvo dohvatimo ID zahtjeva
        const pending = await FollowRequest.findOne({ where: { recipientId: privateUser.id } });

        const res = await request(app)
            .post('/api/follow/respond')
            .set('Authorization', `Bearer ${tokenPrivate}`)
            .send({
                requestId: pending.id,
                action: 'accept'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Zahtjev prihvaćen');

        // Provjera u bazi da je zahtjev obrisan
        const checkRequest = await FollowRequest.findByPk(pending.id);
        expect(checkRequest).toBeNull();
    });

    // --- TESTOVI ZA LISTE I OTPRAĆIVANJE ---

    test('Dohvaćanje liste pratitelja i praćenih', async () => {
        const res = await request(app)
            .get(`/api/follow/lists/${userB.id}`); // Korisnika B prati Korisnik A

        expect(res.statusCode).toBe(200);
        expect(res.body.followers).toHaveLength(1);
        expect(res.body.followers[0].username).toBe('korisnikA');
    });

    test('Korisnik A otpraćuje korisnika B', async () => {
        const res = await request(app)
            .delete(`/api/follow/${userB.id}`)
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Uspješno otpraćeno');
        expect(res.body.followersCount).toBe(0);
    });

    test('Vraća 404 ako korisnik za praćenje ne postoji', async () => {
        const res = await request(app)
            .post('/api/follow/999999')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(404);
    });
});