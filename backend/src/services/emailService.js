import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io", // Podaci s Mailtrapa
  port: 2525,
  auth: {
    user: "moj_user", 
    pass: "moj_pass"
  }
});

export const sendVerificationEmail = async (email, token) => {
  const url = `http://localhost:5173/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: '"Twitter Klon" <noreply@twitter.com>',
    to: email,
    subject: "Potvrdi svoju registraciju",
    html: `<h3>Dobrodošli!</h3>
           <p>Kliknite na link ispod kako biste aktivirali svoj račun:</p>
           <a href="${url}">${url}</a>`
  });
};