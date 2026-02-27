import { jest } from '@jest/globals'; // OVO JE KLJUČNO
import request from 'supertest';
import { app } from '../src/server.js'; // Uvozimo app iz tvog server.js
import User from '../src/models/User.js';
import { sequelize } from '../src/models/index.js';

// MOCKING: Sprječavamo stvarno slanje emailova tijekom testa
jest.mock('../src/services/emailService.js', () => ({
  sendVerificationEmail: jest.fn(() => Promise.resolve(true))
}));

describe('Auth API (Register & Login)', () => {
  
  // Testni podaci
  const testUser = {
    username: 'testko',
    email: 'testko@primjer.com',
    password: 'Password123!'
  };

  // 1. REGISTRACIJA
  test('Treba uspješno registrirati korisnika', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toContain('Registracija uspješna');

    // Provjera u bazi
    const userInDb = await User.findOne({ where: { email: testUser.email } });
    expect(userInDb).not.toBeNull();
    expect(userInDb.isVerified).toBe(false); // Default mora biti false
  });

  // 2. LOGIN POKUŠAJ (Bez verifikacije)
  test('Ne bi smio dopustiti login ako email nije verificiran', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Molimo prvo potvrdite svoj email.');
  });

  // 3. VERIFIKACIJA EMAILA
  test('Treba verificirati korisnika putem tokena', async () => {
    const user = await User.findOne({ where: { email: testUser.email } });
    const token = user.verificationToken;

    const res = await request(app)
      .get(`/api/auth/verify-email?token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('uspješno potvrđen');

    // Provjera u bazi nakon verifikacije
    await user.reload();
    expect(user.isVerified).toBe(true);
    expect(user.verificationToken).toBeNull();
  });

  // 4. USPJEŠAN LOGIN
  test('Treba dopustiti login nakon uspješne verifikacije', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.result.email).toBe(testUser.email);
  });

  // 5. KRIVA LOZINKA
  test('Treba odbiti login s krivom lozinkom', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'KrivaLozinka123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Neispravna lozinka.');
  });
});