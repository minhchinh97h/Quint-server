const express = require("express");
const app = express();
const port = 3000;

const node_env = process.env.NODE_ENV;
let dotenv_result;

if (node_env !== "production") {
  dotenv_result = require("dotenv").config();

  if (dotenv_result.error) {
    console.log(dotenv_result.error);
  }
}
const compression = require("compression");
const helmet = require("helmet");
const errorhandler = require("errorhandler");
const bodyparser = require("body-parser");
const path = require("path");

const firebase_admin = require("firebase-admin");

firebase_admin.initializeApp({
  credential: firebase_admin.credential.cert(
    JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ),
  databaseURL: "https://quint-a7b04.firebaseio.com"
});

const cors = require("cors");
const morgan = require("morgan");

const routes = require("./routes");

app.use(cors());
app.use(morgan("common"));
app.use(compression());
app.use(helmet());
app.use(errorhandler());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, "public")));

app.use(routes);

app.listen(port, () => {
  // console.log(`Example app listening on port ${port}!`)
});
