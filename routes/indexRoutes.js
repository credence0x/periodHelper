const express = require('express'),
  userRoutes = require('./userRoutes'),
  router = express.Router();


router.use("/users", userRoutes)
router.get('/', function (req, res, next) {
  let user = req.user;
  if (user) {
    res.redirect("/users");
  }

  res.render("index")
});

module.exports = router;
