const router = require("express").Router();
const {
  _handlePromiseAll,
  _handlePromise
} = require("../helpers/handle_promises");

router.get("/", async (req, res) => {
  let { action } = req.query;

  if (action === "deleteUnverifiedUsers") {
    res.status(200).json({ msg: "Received cron job" });
  }

  // Return in side request does break the loop
  if (action === "test") {
    const timeOut = t => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (t === 2000) {
            reject(`Rejected in ${t}`);
          } else if (t === 2500) {
            reject(`Rejected in ${t}`);
          } else {
            resolve(`Completed in ${t}`);
          }
        }, t);
      });
    };

    const durations = [1000, 2000, 2500, 3000];

    const promises = durations.map(duration => {
      //   if (duration === 2000) {
      //     return timeOut(duration);
      //   } else if (duration === 2500) {
      //     return timeOut(duration);
      //   } else {
      //     return timeOut(duration).catch(e => {
      //       // res.send(`${duration}`)
      //       // return;
      //     });
      //   }

      return _handlePromise(timeOut(duration));
    });

    let [promise_all_responses, promise_all_error] = await _handlePromiseAll(
      promises
    );

    console.log(promise_all_responses);
    if (promise_all_error) {
      console.log(promise_all_error);
      res.send(promise_all_error);
      return;
    }

    res.send("here");
  } else {
    res.status(200).json({ msg: "OK" });
  }
});

router.post("/", (req, res) => {
  let { body } = req.body;

  if (body === "delete unverified users") {
    console.log("here");

    res.status(200).json({ msg: "OK" });
  }
});

module.exports = router;
