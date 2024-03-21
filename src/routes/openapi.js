const router = require("express").Router();
const uuid = require("uuid").v4;
const axios = require("axios").default;
const nucleoid = require("../nucleoid");
const port = require("../port");

router.post("/", async (req, res) => {
  const sessionId = uuid();
  const terminal = port.inc();

  const instance = await nucleoid.start(sessionId, { terminal });

  const openapi = port.inc();
  instance.openapi = openapi;

  axios
    .post(`http://localhost:${terminal}/openapi`, {
      ...req.body,
      "x-nuc-action": "start",
      "x-nuc-port": openapi,
      "x-nuc-prefix": `/sandbox/${sessionId}`,
    })
    .then(() => {
      console.log(
        `Start process with ${sessionId} - terminal: ${terminal}, openapi: ${openapi}`
      );

      res.json({ id: sessionId });
    })
    .catch((err) => {
      console.error(`There is an error while starting OpenAPI in ${sessionId}`);
      res.status(500).send(err);
    });
});

module.exports = router;
