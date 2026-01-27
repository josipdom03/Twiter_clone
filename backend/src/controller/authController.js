import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail } from '../services/emailService.js';
import jwt from 'jsonwebtoken';

// --- REGISTRACIJA ---
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Provjera postoji li već korisnik
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Korisnik s ovim emailom već postoji." });
    }

    // 2. Hashiranje lozinke
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Generiranje tokena za email verifikaciju
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 4. Kreiranje korisnika u bazi (isVerified je default false)
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      verificationToken: verificationToken
    });

    // 5. Slanje verifikacijskog emaila
    // Napomena: ne čekamo (await) nužno slanje maila da ne usporimo odgovor klijentu, 
    // ali ovdje ćemo čekati radi sigurnosti da znamo da je otišao.
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message: "Registracija uspješna! Molimo provjerite email kako biste aktivirali račun."
    });

  } catch (error) {
    console.error("Greška pri registraciji:", error);
    res.status(500).json({ message: "Interna greška servera pri registraciji." });
  }
};

// --- POTVRDA EMAILA ---
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token nedostaje." });
    }

    // Pronađi korisnika s tim tokenom
    const user = await User.findOne({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).json({ message: "Neispravan ili istekao token." });
    }

    // Označi ga kao verificiranog i obriši token
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Email uspješno potvrđen! Sada se možete prijaviti." });

  } catch (error) {
    console.error("Greška pri verifikaciji:", error);
    res.status(500).json({ message: "Greška pri potvrdi emaila." });
  }
};

// --- LOGIN ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Pronađi korisnika
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Korisnik nije pronađen." });
    }

    // 2. Provjeri je li verificiran
    if (!user.isVerified) {
      return res.status(401).json({ message: "Molimo prvo potvrdite svoj email." });
    }

    // 3. Provjeri lozinku
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Neispravna lozinka." });
    }

    // 4. Generiraj JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Makni lozinku iz response-a
    const { password: _, ...userData } = user.toJSON();

    res.status(200).json({
      result: userData,
      token
    });

  } catch (error) {
    res.status(500).json({ message: "Greška pri prijavi." });
  }
};