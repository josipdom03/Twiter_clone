import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- KONFIGURACIJA MULTERA ---

// Provjeri postoji li 'uploads' folder, ako ne, kreiraj ga
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Ime datoteke: ID-vrijeme.ekstenzija (npr. 1-171500000.jpg)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `user-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Filter za tipove datoteka (samo slike)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Samo slike (jpeg, jpg, png, webp) su dozvoljene!'));
    }
};

export const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Limit 2MB
});

// --- KONTROLER FUNKCIJE ---

// 1. Dohvaćanje profila
export const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'verificationToken'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'Korisnik nije pronađen' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Greška pri dohvaćanju profila', error: error.message });
    }
};

// 2. Ažuriranje profila (Tekst + Slika)
export const updateProfile = async (req, res) => {
    try {
        const { bio, username } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Korisnik nije pronađen' });
        }

        // Ažuriranje tekstualnih polja
        user.bio = bio !== undefined ? bio : user.bio;
        user.username = username || user.username;

        // Ako je korisnik uploadao novu sliku
        if (req.file) {
            // Generiramo puni URL do slike
            // Pretpostavljamo da server radi na portu 3000
            const protocol = req.protocol;
            const host = req.get('host');
            user.avatar = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        await user.save();

        // Vraćamo korisnika bez osjetljivih podataka
        const updatedUser = user.toJSON();
        delete updatedUser.password;
        delete updatedUser.verificationToken;

        res.json(updatedUser);
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: 'Greška pri ažuriranju profila' });
    }
};