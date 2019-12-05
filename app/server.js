const express = require('express')
const app = express()
const port = 3000
const dotenv_result = require("dotenv").config()
const compression = require("compression")
const helmet = require("helmet")
const errorhandler = require("errorhandler")
const bodyparser = require("body-parser")
const path = require("path")

if (dotenv_result.error) {
    console.log(dotenv_result.error)
}

const firebase_admin = require("firebase-admin")
const google_service_account = require("../google_service_account.json")

firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert(google_service_account),
    databaseURL: "https://quint-a7b04.firebaseio.com"
})

const firebase = require("firebase")
firebase.initializeApp(require("../config").firebase_config)
const cors = require("cors")
const morgan = require("morgan")

const routes = require("./routes")

app.use(cors())
app.use(morgan("common"))
app.use(compression())
app.use(helmet())
app.use(errorhandler())
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true }))
app.use("/static", express.static(path.join(__dirname, "public")))

app.use(routes)

app.listen(port, () => {
    // console.log(`Example app listening on port ${port}!`)
})