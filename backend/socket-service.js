const socketIo = require("socket.io");
const meetingReminder = require("./meeting-notification");
const tokenUtilities = require("./utilities/token");
const User = require("./model/user");

const eventEmitter = meetingReminder.eventEmitter;

createSocket = (server) => {
  let allOnlineUsers = [];
  const io = socketIo(server, {
    cors: {
      origin: process.env.SOCKET_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("set-user", (authToken) => {
      tokenUtilities.verifyAuthToken(authToken, (err, decodedToken) => {
        if (err) {
          socket.emit("auth-error", {
            status: 500,
            error: "Please provide correct auth token",
          });
        } else {
          let currentUser = {
            userID: decodedToken.userID,
            userName: decodedToken.userName,
          };
          socket.userID = currentUser.userID;
          socket.join(currentUser.userID);
          socket.join("todo-app");

          console.log(`${currentUser.userName} is online`);
          allOnlineUsers.push(currentUser);
          console.log(allOnlineUsers);

          io.in("todo-app").emit("online-users", allOnlineUsers);
        }
      });
    });

    eventEmitter.on("send-reminder", function (meeting) {
      User.findOne({ _id: meeting.assignedTo, admin: false })
        .then((user) => {
          if (user) {
            const message = `Meeting is going to start soon: ${meeting.title}`;
            io.to(user._id.toString()).emit("meeting-reminder", message);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    });

    socket.on("meeting-created", (meetingDetails) => {
      io.to(meetingDetails.userID.toString()).emit(
        "notify-meeting-created",
        meetingDetails.message
      );
    });

    socket.on("disconnect", () => {
      console.log("user is disconnected");
      var removeIndex = allOnlineUsers
        .map(function (user) {
          return user.userID;
        })
        .indexOf(socket.userID);
      allOnlineUsers.splice(removeIndex, 1);
      console.log(allOnlineUsers);
      socket.leave("todo-app");
      io.in("todo-app").emit("online-users", allOnlineUsers);
    });
  });
};

module.exports = {
  createSocket: createSocket,
};
