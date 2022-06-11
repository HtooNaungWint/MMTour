const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
//new Email(user, url).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.name = user.name;
    this.url = url;
    this.from = `Htoo Naung Wint<${process.env.EMAIL_FROM}>`;
  }
  emailTransport() {
    if (process.env.NODE_ENV == 'production') {
      return nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.GMAIL_PASS,
        },
        tls: {
          ciphers: 'SSLv3',
        },
        //use mailtrap for development
      });
    }

    return nodemailer.createTransport({
      //never use gmail for development service: 'Gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        ciphers: 'SSLv3',
      },
      //use mailtrap for development
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(
      `${__dirname}/../static/emailTemplate/${template}.pug`,
      {
        name: this.name,
        url: this.url,
        subject,
      }
    );

    const emailOptions = {
      form: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    this.emailTransport().sendMail(emailOptions);
  }

  async sendWelcome() {
    const template = 'welcome';
    const subject = `🚍Welcome from MMTour🚍`;
    await this.send(template, subject);
  }
  async sendPasswordRequest() {
    const template = 'passwordReset';
    const subject = `'Password reset | MMTour'`;
    await this.send(template, subject);
  }
};

// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     //never use gmail for development service: 'Gmail',
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,

//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//     tls: {
//       ciphers: 'SSLv3',
//     },
//     debug: true,
//     logger: true,
//     //use mailtrap for development
//   });
//   const emailOptions = {
//     form: process.env.EMAIL_HOST,
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };
//   await transporter.sendMail(emailOptions);
// };

//module.exports = sendEmail;
