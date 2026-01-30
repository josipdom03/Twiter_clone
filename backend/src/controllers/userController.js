import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- KONFIGURACIJA MULTERA ---

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // user-id-timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `user-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Samo slike (jpeg, jpg, png, webp) su dozvoljene!'), false);
    }
};

export const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// --- KONTROLER FUNKCIJE ---

/**
 * 1. Dohvaćanje vlastitog profila (Privatno)
 */
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

/**
 * 2. Ažuriranje vlastitog profila (Tekst + Avatar)
 */
export const updateProfile = async (req, res) => {
    try {
        const { bio, username, displayName } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Korisnik nije pronađen' });
        }

        // Provjera ako korisnik želi promijeniti username na neki koji već postoji
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) {
                return res.status(400).json({ message: 'Korisničko ime je već zauzeto' });
            }
            user.username = username;
        }

        // Ažuriranje ostalih polja
        user.bio = bio !== undefined ? bio : user.bio;
        user.displayName = displayName !== undefined ? displayName : user.displayName;

        // Ako je uploadana nova slika
        if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            // Spremi puni URL ili relativnu putanju (ovisi o frontendu, puni URL je lakši za prikaz)
            user.avatar = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        await user.save();

        // Vraćanje objekta bez passworda
        const updatedUser = user.get({ plain: true });
        delete updatedUser.password;
        delete updatedUser.verificationToken;

        res.json(updatedUser);
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: 'Greška pri ažuriranju profila' });
    }
};

/**
 * 3. Dohvaćanje tuđeg profila po username-u (Javno)
 */
export const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username || username === 'undefined') {
            return res.status(400).json({ message: 'Nevažeći parametar korisničkog imena' });
        }

        const user = await User.findOne({
            where: { username },
            // Za javni profil ne šaljemo email, lozinku ni token
            attributes: ['id', 'username', 'displayName', 'avatar', 'bio', 'createdAt'] 
        });

        if (!user) {
            return res.status(404).json({ message: 'Korisnik nije pronađen' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Greška na serveru', error: error.message });
    }
};