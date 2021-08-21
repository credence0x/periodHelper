const User = require("../models/user"),
    { check, validationResult } = require("express-validator"),
    passport = require('passport');



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
getUserUpdateParams = body => {
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
        if (redirectPath) res.redirect(redirectPath);
        else next();
    },
    signUp: (req, res) => {
        let repopulate = req.query || false
        res.render("users/signUp", { repopulate: repopulate })
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
        // console.log(updatedUser)
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
        console.log(repopulate)
        res.render("users/update", { repopulate: repopulate })
    },

    home: (req, res) => {
        Date.prototype.addDays = function (days) {
            var date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        }


        let user = req.user,
            allowance = 1, // + or - 1 day
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
                i += 1
                lastPeriod = lastPeriod.addDays(interval + daysPeriodLast)
                difference_in_time = todaysDate.getTime() - lastPeriod.getTime();
                difference_in_days = difference_in_time / (1000 * 3600 * 24);

            }
            console.log(i)

            user.lastPeriod = lastPeriod
            user.save()
        }
        let info = "",
            menoMessage = "",
            menopause = 50 - user.age,
            menoTrue = menopause > 0;

        if (menoTrue) {
            menoMessage = `You have about ${menopause} years till menopause. `

        } else {
            menoMessage = `You are rapidly approaching menopause. The pain will soon be over `

        }
        //if it is within the period range
        if ((todaysDate >= nextPeriodStart) && (todaysDate < nextPeriodEnd)) {
            if (todaysDate < nextPeriodEnd - 2) {
                info = "You should be on your period already. How's it going?"
            } else if (todaysDate >= (nextPeriodEnd - 2)) {
                info = "The blood bath should end anytime soon"
            }

            //else if 10 days after last period
        } else if (todaysDate <= lastPeriod.addDays(10)) {
            info = "It's should be safe to have sex (y):)."
            info += " Note that I will not be responsible if you eventually get pregnant"

        } else if (todaysDate > lastPeriod.addDays(10)) {
            let diff = lastPeriod.addDays(interval).getTime() - todaysDate.getTime(),
                diff_in_days = parseInt(diff / (1000 * 3600 * 24));
            info = `Next period should start in about ${diff_in_days} days`
        }


        res.render("users/home", {
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