const nodemailer = require('nodemailer');
const aws = require('aws-sdk');

class Email {
  static async sendEmail(to, from, subject, body, toName, fromName) {
    //override recipient for dev
    if (process.env.DEV_EMAIL && process.env.DEV_EMAIL !== '') {
      to = process.env.DEV_EMAIL;
    }

    if (toName && toName !== '') {
      to = toName + ' <' + to + '>';
    }

    if (fromName && fromName !== '') {
      from = fromName + ' <' + from + '>';
    }

    let transporter = nodemailer.createTransport({
      SES: new aws.SES({
        apiVersion: '2010-12-01',
        accessKeyId: process.env.AWS_ID,
        secretAccessKey: process.env.AWS_SECRET,
        region: 'us-east-1',
      }),
    });

    await transporter.sendMail({
      from: from,
      to: to,
      subject: subject,
      text: body,
    });
  }
}

module.exports = Email;
