const jwt = require('jsonwebtoken'),
    secret = process.env.JWT_SECRET || "my______secret______key________";

module.exports = {
    createToken: (user_id) => {
        value = {
            id: user_id,
        }
        token = jwt.sign({
            data: value
        }, secret, { expiresIn: 60 * 10 }); //expires after ten minutes

        response_token = { token: token }
        return response_token
    },

    verifyToken: (token) => {
        try {
            var value = jwt.verify(token, secret);
            if (value) {

                json_res = {
                    authenticated: true,
                    id: value.data.id
                }

                return json_res
            } else {
                json_res = { authenticated: false }
                return json_res
            }
          } catch(err) {
            console.log("err")
                json_res = { authenticated: false }
                return json_res
          }
        
    }
}