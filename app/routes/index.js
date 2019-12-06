const router = require("express").Router()

const auth = require("./auth")
const users = require("./users")

router.use("/auth", auth)
router.use("/users", users)

router.get("/", (req, res) => {
    res.send("This is a response.")
})

module.exports = router