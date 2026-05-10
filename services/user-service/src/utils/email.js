const nodemailer = require('nodemailer');

const sendEmail = async options => {


    if (process.env.NODE_ENV === 'test') {
        console.log(`[TEST] Mock email to=${options.email} subject="${options.subject}"`);
        return;
    }
    
    // 1) Create a transporter // server that will send the email
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        // service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        },
    });

    // 2) Define the email options
    const mailOptions = {
        from: 'mahmoud tarek <hello@mahmoud.io>',
        to: options.email,
        subject: options.subject,
        text: options.message
        // html: 
    }

    // 3) Send the email with nodemailer

    await transporter.sendMail(mailOptions);

};

module.exports = sendEmail;