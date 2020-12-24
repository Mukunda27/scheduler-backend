const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const userRoutes = require("./backend/routes/user");
const meetingRoutes = require("./backend/routes/meeting");
const cors = require("cors");
const passport = require("passport");

swaggerDocument = require("./swagger.json");

mongoose.set("useCreateIndex", true);
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);

mongoose
  .connect(
    "mongodb+srv://Muku_27:" +
      process.env.MONGODB_ATLAS_PWD +
      "@cluster0.isjwc.mongodb.net/scheduler?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("Connected to Mongo Database");
  })
  .catch(() => {
    console.log("Could not connect Mongo Database");
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );

  next();
});

app.options("*", cors());

require("./backend/meeting-notification");

require("./backend/authentication/jwt");
app.use(passport.initialize());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/user", userRoutes);
app.use(
  "/api/meeting",
  passport.authenticate("jwt", { session: false }),
  meetingRoutes
);

app.use("/", (req, res, next) => {
  res.send(
    `Success !!. You have reached Meeting Scheduler REST API. You can discover all the routes <a href="${process.env.BE_URL}/api-docs"> here </a> `
  );
});

module.exports = app;
