const jwt = require("jsonwebtoken");

// Generate an Access Token for the given User ID
const generateAccessToken = (userId, userName) => {
  const expiresIn = "1h";
  const secret = process.env.JWT_KEY;

  const token = jwt.sign(
    { userID: userId.toString(), userName: userName.toString() },
    secret,
    {
      expiresIn: expiresIn,
      subject: userId.toString(),
    }
  );

  return token;
};

let verifyAuthToken = (token, cb) => {
  const secret = process.env.JWT_KEY;

  jwt.verify(token, secret, function (err, decoded) {
    if (err) {
      console.log("error while verify token");
      cb(err, null);
    } else {
      console.log("user verified");
      cb(null, decoded);
    }
  });
};

module.exports = {
  generateAccessToken: generateAccessToken,
  verifyAuthToken: verifyAuthToken,
};
