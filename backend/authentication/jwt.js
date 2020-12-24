var passport = require("passport");
var passportJWT = require("passport-jwt");
const User = require("../model/user");

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = process.env.JWT_KEY;

var strategy = new JwtStrategy(jwtOptions, (jwt_payload, next) => {
  User.findOne({ _id: jwt_payload.sub })
    .then((user) => {
      if (user) {
        return next(null, user);
      } else {
        return next(null, false);
      }
    })
    .catch((error) => {
      console.log(error);
      return next(error, null);
    });
});

passport.use(strategy);
