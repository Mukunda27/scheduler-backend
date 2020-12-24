const Agenda = require("agenda");
const events = require("events");
const emailUtilities = require("./utilities/email");

const Meeting = require("./model/meeting");
const User = require("./model/user");

const addMinutes = require("date-fns/addMinutes");
const subMinutes = require("date-fns/subMinutes");
const difference = require("date-fns/differenceInMilliseconds");
const user = require("./model/user");

const eventEmitter = new events.EventEmitter();

const mongoConnectionString =
  "mongodb+srv://Muku_27:" +
  process.env.MONGODB_ATLAS_PWD +
  "@cluster0.isjwc.mongodb.net/scheduler?retryWrites=true&w=majority";

const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: "reminders" },
});

agenda.define("meeting reminder", async (job) => {
  console.log("hi");
  const rangeStart = addMinutes(Date.now(), 1);
  const rangeEnd = addMinutes(Date.now(), 31);
  Meeting.find({
    startTime: {
      $gt: rangeStart,
      $lt: rangeEnd,
    },
  }).then((meetings) => {
    meetings.forEach((meeting) => {
      const reminderTime = subMinutes(meeting.startTime, 1);
      const timeFromNow = difference(reminderTime, Date.now());
      setTimeout(() => {
        eventEmitter.emit("send-reminder", meeting);
        User.findOne({ _id: meeting.assignedTo })
          .then((user) => {
            return emailUtilities.reminderMail(user.email, meeting);
          })
          .then((result) => {
            console.log("sent remonder mail");
          });
      }, timeFromNow);
    });
  });
});

(async function () {
  await agenda.start();
  await agenda.every("30 minutes", "meeting reminder");
})();

module.exports = {
  eventEmitter: eventEmitter,
};
