import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
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

export default authMiddleware;