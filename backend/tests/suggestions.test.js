import { jest } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/server.js';
import { User, Follow, sequelize } from '../src/models/index.js';
import jwt from 'jsonwebtoken';

describe('Suggestions API', () => {
    let userA, userB, userC, userD, tokenA;

    beforeAll(async () => {
        await sequelize.sync({ force: true });

        // 1. Kreiramo korisnike
        // userA je onaj koji traži prijedloge
        userA = await User.create({ username: 'userA', email: 'a@t.com', password: 'P1!', isVerified: true });
        // userB je netko koga userA VEĆ prati (ne smije se pojaviti u prijedlozima)
        userB = await User.create({ username: 'userB', email: 'b@t.com', password: 'P1!', isVerified: true });
        // userC je prijedlog (userB ga prati, pa je on "mutual" za userA)
        userC = await User.create({ username: 'userC', email: 'c@t.com', password: 'P1!', isVerified: true });
        // userD je privatan (ne smije se pojaviti u prijedlozima)
        userD = await User.create({ username: 'userD', email: 'd@t.com', password: 'P1!', isVerified: true, isPrivate: true });

        // 2. Postavljamo follow relacije za "mutual" logiku
        // A prati B
        await Follow.create({ follower_id: userA.id, following_id: userB.id });
        // B prati C (C postaje mutual prijatelj za A)
        await Follow.create({ follower_id: userB.id, following_id: userC.id });

        const secret = process.env.JWT_SECRET || 'secret';
        tokenA = jwt.sign({ id: userA.id }, secret);
    });

    // --- TEST: GET /api/suggestions (Generalni prijedlozi) ---

    test('Treba dohvatiti prijedloge (isključiti sebe, već praćene i privatne profile)', async () => {
        const res = await request(app)
            .get('/api/suggestions')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        // Provjera isključenja
        const ids = res.body.map(u => u.id);
        expect(ids).not.toContain(userA.id);      // Ne nudi samog sebe
        expect(ids).not.toContain(userB.id);      // Ne nudi onoga koga već prati
        expect(ids).not.toContain(userD.id);      // Ne nudi privatne profile
        
        // Treba nuditi userC
        expect(ids).toContain(userC.id);
    });

    test('Treba ispravno izračunati mutualCount', async () => {
        const res = await request(app)
            .get('/api/suggestions')
            .set('Authorization', `Bearer ${tokenA}`);

        const suggestedUserC = res.body.find(u => u.id === userC.id);
        
        // Budući da userA prati userB, a userB prati userC:
        // mutualCount za userC mora biti barem 1
        expect(parseInt(suggestedUserC.mutualCount)).toBeGreaterThanOrEqual(1);
    });

    // --- TEST: GET /api/suggestions/mentions (Autocomplete za @mention) ---

    test('Treba vratiti korisnike koji odgovaraju search queryju', async () => {
        const res = await request(app)
            .get('/api/suggestions/mentions?search=userB')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].username).toBe('userB');
    });

    test('Treba vratiti praznu listu ako nema search queryja', async () => {
        const res = await request(app)
            .get('/api/suggestions/mentions')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('Treba ograničiti broj rezultata mentona na 5', async () => {
        // Kreiramo hrpu sličnih usera
        await User.bulkCreate([
            { username: 'test1', email: 't1@t.com', password: 'P1!' },
            { username: 'test2', email: 't2@t.com', password: 'P1!' },
            { username: 'test3', email: 't3@t.com', password: 'P1!' },
            { username: 'test4', email: 't4@t.com', password: 'P1!' },
            { username: 'test5', email: 't5@t.com', password: 'P1!' },
            { username: 'test6', email: 't6@t.com', password: 'P1!' },
        ]);

        const res = await request(app)
            .get('/api/suggestions/mentions?search=test')
            .set('Authorization', `Bearer ${tokenA}`);

        expect(res.body.length).toBeLessThanOrEqual(5);
    });
});