const router = require("express").Router()

router.get("/", (req, res) => {
    let { action } = req.query

    if (action === "deleteUnverifiedUsers") {

        res.status(200).json({ msg: "Received cron job" })
    }

    res.status(200).json({ msg: "OK" })
})

router.post("/", (req, res) => {
    let { body } = req.body

    if (body === "delete unverified users") {
        console.log("here")

        res.status(200).json({ msg: "OK" })
    }
})

module.exports = router