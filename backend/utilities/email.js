const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  auth: {
    user: "supp.meetup@gmail.com",
    pass: process.env.MAIL_PWD,
  },
});

const formatMail = (emailAddress, subject, text) => {
  const mail = {
    to: emailAddress,
    from: "supp.meetup@gmail.com",
    subject: subject,
    html: text,
  };
  return mail;
};

const sendPasswordResetMail = (emailAddress, resetToken) => {
  const promise = new Promise((resolve, reject) => {
    const subject = "MeetUP Password Reset";
    const text = `<div style="color: white;
                  background-color: #00478f;
                  padding: 10px;
                  width: 100%;
                  font-size: 20px;
                  text-align: center;">
                     MeetUP
                  </div> 
                 <h3> Hi, </h3>
                 <p> You are receiving this because you (or someone else) has requested password reset for your account on MeetUp</p> 
                 <a href="${process.env.APP_URL}/auth/new-password/${resetToken}"
                  style="padding: 10px;
                         color: white;
                        background-color: #00478f;
                        border-radius: 5px;
                        outline: none;">
                  Reset Password
                  </a>
                  <p>If you did not request this, please ignore this email and your password will remain unchanged</p>`;
    const mail = formatMail(emailAddress, subject, text);
    transporter.sendMail(mail, (err, info) => {
      if (err) {
        reject(err);
      } else {
        resolve("success");
      }
    });
  });
};

const meetingReminderMail = (emailAddress, meeting) => {
  const promise = new Promise((resolve, reject) => {
    const subject = "MeetUP : Meeting starting soon";
    const text = `<div style="color: white;
                              background-color: #00478f;
                              padding: 10px;
                              width: 100%;
                              font-size: 20px;
                              text-align: center;">
                  MeetUP
                  </div> 
                  <h3> Hi, </h3>
                  <p> You have a meeting set to start in one minute. Please make sure to attend the meeting on time</p>
                  <p>For further meeting details, please login to your account to see the calendar</p> 
                  <a href="${process.env.APP_URL}/auth/login"
                       style="padding: 10px;
                              color: white;
                              background-color: #00478f;
                              border-radius: 5px;
                              outline: none;">
                  Meeting Details
                 </a>
                 <p>Regards,</p> 
                 <p>Team MeetUP</p>`;
    const mail = formatMail(emailAddress, subject, text);
    transporter.sendMail(mail, (err, info) => {
      if (err) {
        reject(err);
      } else {
        resolve("success");
      }
    });
  });
};

module.exports = {
  passwordResetMail: sendPasswordResetMail,
  reminderMail: meetingReminderMail,
};
