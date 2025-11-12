import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
<<<<<<< HEAD
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
=======
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
>>>>>>> 51c63e367b1ab82eda7c1676d8096da5c59f8e53
});

export default transporter;