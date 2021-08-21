
const mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose"),
    { Schema } = mongoose,
    userSchema = new Schema({
        name: {
            first: {
                type: String,
                trim: true, // remove white spaces
                required: true
            },
            last: {
                type: String,
                trim: true,
                required: true
            }
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true
        },
        lastPeriod: {
            type: Date,
            required: true,

        },
        intervalBetweenPeriods: {
            //you see your period after about how many days from the last
            //i'm not collecting the next date so users don't think they have to continually reset it
            type: Number,
            required: true,

        },
        daysPeriodLast: {
            type: Number,
            required: true
        },
        age: {
            type: Number,
            required: true
        }
    }, {
        timestamps: true
    });


userSchema.virtual("fullName")
    .get(function () {
        return `${this.name.first} ${this.name.last}`;
    });


userSchema.plugin(passportLocalMongoose, {
    usernameField: "email" //defaults to username field
});
module.exports = mongoose.model("User", userSchema);
