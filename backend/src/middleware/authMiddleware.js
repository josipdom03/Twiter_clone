import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  // 1. Uzmi token iz headera (format: "Bearer TOKEN_STRING")
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Pristup odbijen. Token nije dostavljen." });
  }

  try {
    // 2. Verificiraj token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Dodaj podatke o korisniku u req objekt (npr. req.user.id)
    req.user = decoded;
    
    // 4. Pusti zahtjev dalje prema kontroleru
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(403).json({ message: "Neispravan ili istekao token." });
  }
};

export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // Ako nema tokena, samo prođi dalje bez req.user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];
    try {
        // Ako je token tu, pokušaj ga dekodirati
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        // Čak i ako je token neispravan (istekao), nećemo srušiti request, 
        // samo ćemo tretirati korisnika kao gosta
        req.user = null;
    }
    next();
};

