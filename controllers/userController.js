const User = require("../models/user"),
    { check, validationResult } = require("express-validator"),
    passport = require('passport'),
    tokenController = require("./tokenController");



getUserParams = body => {
    return {
        name: {
            first: body.first,
            last: body.last
        },
        email: body.email,
        password: body.password,
        lastPeriod: body.lastPeriod,
        intervalBetweenPeriods: body.interval,
        daysPeriodLast: body.daysPeriodLast,
        age: body.age,
    };
};
getUserUpdateParams = (body) => {
    return {
        name: {
            first: body.first,
            last: body.last
        },
        lastPeriod: body.lastPeriod,
        intervalBetweenPeriods: body.interval,
        daysPeriodLast: body.daysPeriodLast,
        age: body.age,
    };
};
constructQueryParams = (body) => {
    let none = "null",
        queryParams = "",
        hash = {
            first: body.first,
            last: body.last,
            email: body.email || none, //for update function
            lastPeriod: body.lastPeriod,
            interval: body.interval,
            daysPeriodLast: body.daysPeriodLast,
            age: body.age
        }
    for (key in hash) {
        let sign = "&"
        if (key == "first") { sign = "?" }
        queryParams = queryParams + `${sign}${key}=${hash[key]}`
    }

    return queryParams;
}

// checkIfType = (value, type) => {
//     let ans = Object.prototype.toString.call(value) === Object.prototype.toString.call(new type)
//     if (ans) { return true }
//     else { return false }
// }

module.exports = {

    login: (req, res) => {
        res.render("users/login")
    },
    authenticate: (req, res, next) => {
        // intentionally didn't use the passport shorcuts
        passport.authenticate('local', (err, user, info) => {
            if (err) { next(err) }
            else if (!user) {
                req.flash("error", info.message)
                res.locals.redirect = "/users/login"
                next()
            } else {
                req.logIn(user, (err) => {
                    if (err) { next(err); }
                    req.flash("success", "Logged in successfully!")
                    if (!req.session.returnTo) {
                        res.locals.redirect = "/users"
                    } else {
                        res.locals.redirect = req.session.returnTo //connect-ensure-login variable
                    }
                    next()
                });
            }
        })(req, res, next);

    },
    redirectView: (req, res, next) => {
        console.log("redirect works")

        let redirectPath = res.locals.redirect;
        console.log(redirectPath)
        if (redirectPath) { res.redirect(redirectPath) }
        else { next() }
    },
    signUp: (req, res) => {
        let repopulate = req.query || false
        let maxDate = new Date().toISOString().substring(0, 10);

        res.render("users/signUp", { repopulate: repopulate,
            maxDate:maxDate })
    },



    validate: () => {
        return [
            check("email")
                .normalizeEmail({
                    all_lowercase: true
                })
                .trim(),
            check("email").isEmail(),
            check("password").notEmpty(),
            check("age").notEmpty(),
            check("daysPeriodLast").notEmpty(),
            check("lastPeriod").notEmpty(),
            check("interval").notEmpty()

        ]
    },


    checkValidate: (req, res, next) => {
        let error = validationResult(req)

        console.log(error)
        if (!error.isEmpty()) {
            let messages = error.array().map(e => e.msg);
            req.skip = true;
            req.flash("error", messages.join(" and "));
            console.log(messages.join(" and "))
            queryParams = constructQueryParams(req.body)
            res.locals.redirect = "/users/sign-up" + queryParams
            next();
        } else {
            next();
        }

    },


    create: (req, res, next) => {

        if (req.skip) { next() }
        let newUser = new User(getUserParams(req.body));
        User.register(newUser, req.body.password, (error, user) => {
            if (user) {
                req.flash("success", "Your registration was successful. Please login to continue");
                res.locals.redirect = "/users/login"
                next()
            } else {
                if (error.name == "UserExistsError") {
                    // em = ErrorMessage
                    let em = "A user with the given email address already exists"
                    req.flash("error", em)
                    queryParams = constructQueryParams(req.body)
                    res.locals.redirect = "/users/sign-up" + queryParams

                    next()
                };
                next(error)
            }
        })

    },
    update: (req, res, next) => {
        if (req.skip) { next() }
        let updatedUser = getUserUpdateParams(req.body);
        User.findOneAndUpdate({ _id: req.user._id }, { $set: updatedUser }, (error, user) => {
            if (user) {
                req.flash("success", "Your profile was updated successfully");
                res.locals.redirect = "/users"
                next()
            }
            next(error)
        }
        )

    },
    editPage: (req, res, next) => {
        let repopulate;
        if (Object.keys(req.query).length != 0) {
            repopulate = req.query
        } else {
            repopulate = req.user
        }
        let maxDate = new Date().toISOString().substring(0, 10);
        res.render("users/update", { repopulate: repopulate,
                                         maxDate:maxDate })
    },

    resetPage: (req, res, next) => {

        res.render("users/resetPassword")
    },
    checkReset: (req, res, next) => {
        let query = req.query,
            email = query.email || "",
            lastName = query.last|| "",
            out = {},
            token = "";
        User.find({ "email": email }, (error, user) => {
            user = user[0]
            console.log("e", error, "u", user)

            out = {
                success: false,
                message: "E-mail and last name did not match"
            }
            if (user) {

                if (user.name.last.toLowerCase() == lastName.toLowerCase()) {
                    token = tokenController.createToken(user._id).token
                    out = {
                        success: true,
                        message: "",
                        url: `/users/new-password?token=${token}`
                    }
                }


            }
            console.log(out)
            res.json(out)

        })



    },
    newPasswordPage: (req, res) => {
        let token = req.query.token || "fake"
        let verify = tokenController.verifyToken(token);
        if (!verify.authenticated){
            res.json({success:false,
            message: "Invalid token"})
        }
        res.render("users/newPassword")

    },
    newPasswordSubmit: (req, res,next) => {

        
        let token = req.query.token || "fake",
            verify = tokenController.verifyToken(token);

        if (verify.authenticated) {
            let user_id = verify.id;
            User.findById(user_id, (error, user) => {
                if (user) {
                    let password = req.body.password
                    console.log(user_id, password)
                    user.setPassword(password, () => {
                        user.save()
                        req.flash("success", "Password changed successfully. Log in to continue");
                        res.locals.redirect = "/users/login"
                        next()
                    })
                }
                console.log("not supposed to happen")
            })

        } else {
            req.flash("success", "Token is no longer valid. Please fill this again");
            res.locals.redirect = "/users/reset-password"
            next()
        }
    },
    home: (req, res) => {
        Date.prototype.addDays = function (days) {
            var date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        }


        let user = req.user,
            allowance = 0, // + or - 1 day
            lastPeriod = user.lastPeriod,
            daysPeriodLast = user.daysPeriodLast,
            interval = user.intervalBetweenPeriods,
            nextPeriodStart = lastPeriod.addDays(interval - allowance),
            nextPeriodEnd = nextPeriodStart.addDays(daysPeriodLast + allowance),
            todaysDate = new Date();

        // function to update last period date
        let i = 0
        if (todaysDate > nextPeriodEnd) {
            let difference_in_time = todaysDate.getTime() - lastPeriod.getTime(),
                difference_in_days = difference_in_time / (1000 * 3600 * 24);
            while ((todaysDate > lastPeriod) && (difference_in_days > interval)) {
                // if within period
                if ((todaysDate >= nextPeriodStart) && (todaysDate < nextPeriodEnd)) {
                    // console.log("within")
                    break
                }
                console.log(difference_in_days)
                i += 1
                lastPeriod = lastPeriod.addDays(interval + daysPeriodLast)
                console.log(difference_in_days, lastPeriod)
                difference_in_time = todaysDate.getTime() - lastPeriod.getTime();
                difference_in_days = difference_in_time / (1000 * 3600 * 24);
                nextPeriodStart = lastPeriod.addDays(interval - allowance);
                nextPeriodEnd = nextPeriodStart.addDays(daysPeriodLast + allowance);

            }

            user.lastPeriod = lastPeriod
            user.save()

        }
        let diff = lastPeriod.addDays(interval).getTime() - todaysDate.getTime(),
            diff_in_days = parseInt(diff / (1000 * 3600 * 24));
        let info = [],
            menoMessage = "",
            periodMessage = "",
            menopause = 50 - user.age,
            menoTrue = menopause > 0;

        let ten_days_diff = lastPeriod.addDays(10) > todaysDate




        if (menoTrue) {
            menoMessage = `You also have about ${menopause} years till menopause. `

        } else {
            menoMessage = `You are also rapidly approaching menopause`

        }
        //if it is within the period range
        if ((todaysDate >= nextPeriodStart) && (todaysDate < nextPeriodEnd)) {
            periodMessage = `Your period started on ${nextPeriodStart.toUTCString().slice(0, -12)} and should end on ${nextPeriodEnd.toUTCString().slice(0, -12)}`
            if (todaysDate < nextPeriodEnd - 2) {
                info.push(" We hope it's going okay")
            } else if (todaysDate >= (nextPeriodEnd - 2)) {
                info.push("Your period should end anytime soon")
            }

            //else if within 10 days after last period
        } else if (ten_days_diff) {
            periodMessage = `Your period starts on ${nextPeriodStart.toUTCString().slice(0, -12)}. `
            periodMessage += `That is, in about ${diff_in_days} day(s)`
            // info.push("It's should be safe to have sex since your period ended just a few days ago :)")
            // info.push("Note that we will however not be liable to contribute to your child's upbringing if you eventually get pregnant")

        } else if (!ten_days_diff) {
            periodMessage = `Your next period starts on ${nextPeriodStart.toUTCString().slice(0, -12)}`
            info.push(`That is, in about ${diff_in_days} day(s)`)
        }


        res.render("users/home", {
            periodMessage: periodMessage,
            info: info,
            menoMessage: menoMessage
        })



    },
    logout: (req, res, next) => {
        // console.log("Goodnight, my love")
        req.logout();
        req.flash("success", "You have been logged out!");
        res.locals.redirect = "/users/login";
        next();
    },

}