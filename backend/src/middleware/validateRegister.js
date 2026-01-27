export const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Sva polja su obavezna." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Lozinka mora imati barem 6 znakova." });
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Neispravan format emaila." });
  }

  next(); // Ako je sve OK, idi na kontroler
};