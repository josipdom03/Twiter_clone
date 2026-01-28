import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Učitavamo varijable iz .env datoteke
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "2525"),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Šalje email s verifikacijskim linkom novom korisniku.
 */
export const sendVerificationEmail = async (email, token) => {
  // Link koji vodi na tvoj React FRONTEND (Vite port 5173)
  const url = `http://localhost:5173/verify-email?token=${token}`;

  const mailOptions = {
    from: '"Twitter Klon 🐦" <noreply@twitterclone.com>',
    to: email,
    subject: "Potvrdi svoju registraciju na Twitter Klonu",
    // Dodajemo HTML s malo CSS-a za bolji izgled
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8ed; border-radius: 15px; overflow: hidden;">
        <div style="background-color: #1DA1F2; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Twitter Klon</h1>
        </div>
        <div style="padding: 20px; color: #14171a;">
          <h2>Skoro ste gotovi!</h2>
          <p>Hvala vam što ste se registrirali. Kako biste aktivirali svoj račun i počeli objavljivati tweetove, molimo potvrdite svoju email adresu klikom na gumb ispod:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #1DA1F2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">
              Potvrdi Email
            </a>
          </div>
          <p style="font-size: 12px; color: #657786;">Ako gumb ne radi, kopirajte ovaj link u svoj preglednik:</p>
          <p style="font-size: 12px; color: #1DA1F2; word-break: break-all;">${url}</p>
        </div>
        <div style="background-color: #f5f8fa; padding: 15px; text-align: center; font-size: 12px; color: #657786;">
          &copy; ${new Date().getFullYear()} Twitter Klon. Sva prava pridržana.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email uspješno poslan na: ${email}. ID poruke: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Greška pri slanju emaila:", error);
    // Bacamo grešku dalje kako bi je controller mogao uhvatiti i javiti frontendu
    throw new Error("Slanje verifikacijskog emaila nije uspjelo.");
  }
};