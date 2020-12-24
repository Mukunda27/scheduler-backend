const express = require("express");
const router = express.Router();

const Meeting = require("../model/meeting");
const User = require("../model/user");

const startOfDay = require("date-fns/startOfDay");

router.post("/create", (req, res, next) => {
  if (
    !req.body.title ||
    !req.body.date ||
    !req.body.startTime ||
    !req.body.endTime ||
    !req.body.location ||
    !req.body.assignedTo
  ) {
    return res
      .status(400)
      .json({ message: "Some parameters are missing in the request body" });
  }

  const meeting = new Meeting({
    title: req.body.title,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    location: req.body.location,
    creator: req.user._id,
    assignedTo: req.body.assignedTo,
  });

  meeting
    .save()
    .then((result) => {
      res.status(201).json({
        message: "Meeting Created!!",
        meeting: result,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

router.get("/all-meetings", (req, res, next) => {
  if (
    !req.query.userID ||
    !req.query.year ||
    !req.query.month ||
    !req.query.date ||
    !req.query.offset
  ) {
    return res
      .status(400)
      .json({ message: "Some query parameters are missing in the request" });
  }

  const filter = {
    $and: [
      { convertedAssignedTo: req.query.userID },
      { startTimeYear: req.query.year },
      { startTimeMonth: req.query.month },
      { startTimeDate: req.query.date },
    ],
  };

  Meeting.aggregate([
    {
      $addFields: {
        convertedAssignedTo: { $toString: "$assignedTo" },
        convertedStartTime: {
          $dateToParts: {
            date: "$startTime",
            timezone: getTimeZoneOffset(req.query.offset),
          },
        },
      },
    },
    {
      $addFields: {
        startTimeYear: { $toString: "$convertedStartTime.year" },
        startTimeMonth: { $toString: "$convertedStartTime.month" },
        startTimeDate: { $toString: "$convertedStartTime.day" },
      },
    },
    {
      $match: filter,
    },
    {
      $lookup: {
        from: "users",
        localField: "creator",
        foreignField: "_id",
        as: "creator",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
      },
    },
  ])
    .exec()
    .then((documents) => {
      res.status(200).json({
        message: "Meeting Fetched!!",
        meetings: documents,
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

router.get("/all-nonadmin-users", (req, res, next) => {
  User.findOne({ _id: req.user._id })
    .then((user) => {
      return User.find({
        _id: { $ne: user._id },
        admin: false,
      });
    })
    .then((allUsers) => {
      res.status(200).json({
        users: allUsers,
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

router.put("/:id", (req, res, next) => {
  if (
    !req.body.title ||
    !req.body.date ||
    !req.body.startTime ||
    !req.body.endTime ||
    !req.body.location
  ) {
    return res
      .status(400)
      .json({ message: "Some parameters are missing in the request body" });
  }

  User.findOne({ _id: req.user._id })
    .then((user) => {
      if (!user.admin) {
        res
          .status(401)
          .json({ message: "User is not authorized to edit meeting" });
      }

      return Meeting.findOneAndUpdate(
        {
          _id: req.params.id,
        },
        {
          $set: {
            title: req.body.title,
            date: req.body.date,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            location: req.body.location,
            creator: req.user._id,
          },
        }
      );
    })
    .then((result) => {
      res.status(200).json({ message: "Meetings details change successful!" });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

router.delete("/:id", (req, res, next) => {
  User.findOne({ _id: req.user._id })
    .then((user) => {
      if (!user.admin) {
        res
          .status(401)
          .json({ message: "User is not authorized to delete meeting" });
      }
      return Meeting.deleteOne({
        _id: req.params.id,
      });
    })
    .then((result) => {
      if (result.n > 0) {
        res.status(200).json({ message: "Deletion successful!" });
      }
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
});

const getTimeZoneOffset = (offset) => {
  const absOffset = Math.abs(offset);
  return (
    (offset < 0 ? "+" : "-") +
    ("00" + Math.floor(absOffset / 60)).slice(-2) +
    ":" +
    ("00" + (absOffset % 60)).slice(-2)
  );
};

module.exports = router;
