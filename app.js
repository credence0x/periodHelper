
const path = require('path'),
  favicon = require('serve-favicon'),
  logger = require('morgan'),
  layouts = require("express-ejs-layouts"),
  router = require("./routes/indexRoutes"),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  passport = require("passport"),
  expressSession = require("express-session"),
  connectFlash = require("connect-flash"),
  express = require('express'),
  User = require('./models/user'),
  app = express();



mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/PeriodHelper",


  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  });
const db = mongoose.connection;
db.once("open", () => {
  console.log("Successfully connected to MongoDB using Mongoose!");
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(layouts)

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cookieParser(process.env.COOKIE_SCRT || "bu6qwsqdqwWQB9823236437opap928[93212^&*(!"));
const sessionMiddleware = expressSession({
  secret: process.env.SESSION_SCRT || "e2yedkwuoew67sd0s-$R-sawqdqw-qwd02",
  cookie: {
    maxAge: 4000000
  },
  resave: false,
  saveUninitialized: false
})
app.use(sessionMiddleware);
app.use(connectFlash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.locals.flashMessages = req.flash() || {};
  res.locals.loggedIn = req.isAuthenticated();
  res.locals.currentUser = req.user;
  next();
});

app.use('/', router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;

  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = err

  // render the error page
  console.log(req.session.returnTo)
  req.session.returnTo =""

  console.log(err)
  res.status(err.status || 500);
  if (!err.status){
    res.locals.message = "Server Error";
    res.locals.error = {status:500}
  }
  console.log(err)
  res.render('error');
});

app.set("port", process.env.PORT || 3000);
const port = app.get('port')
const server = app.listen(port, () => {
  console.info(`The ChatApp server has started and is listening on port number: ${port}`)
})

// module.exports = app;
