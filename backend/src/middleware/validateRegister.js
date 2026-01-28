export const validateRegister = (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 1. Provjera postoje li podaci u tijelu zahtjeva
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: "Sva polja su obavezna: korisničko ime, email i lozinka." 
      });
    }

    // 2. Provjera formata emaila (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Unesena email adresa nije ispravnog formata." 
      });
    }

    // 3. Provjera minimalne duljine lozinke
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Lozinka mora imati barem 6 znakova." 
      });
    }

    // 4. Provjera minimalne duljine korisničkog imena
    if (username.length < 3) {
      return res.status(400).json({ 
        message: "Korisničko ime mora imati barem 3 znaka." 
      });
    }

    // Ako je sve prošlo, šalji dalje na controller
    next();
  } catch (error) {
    console.error("Greška u validaciji:", error);
    return res.status(500).json({ message: "Greška na serveru prilikom validacije." });
  }
};