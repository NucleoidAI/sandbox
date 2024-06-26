const router = require("express").Router();
const uuid = require("uuid").v4;
const axios = require("axios").default;
const nucleoid = require("../nucleoid");
const port = require("../port");

router.post("/", async (req, res) => {
  const sessionId = uuid();
  const terminal = port.inc();

  const session = await nucleoid.start(sessionId, { terminal });

  const openapi = port.inc();
  session.openapi = openapi;

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
    .catch(({ response, message }) => {
      console.error(`There is an error while starting OpenAPI in ${sessionId}`);

      if (response) {
        const { headers, status, data } = response;
        res.set(headers).status(status).send(data);
      } else {
        res.status(500).json({ message });
      }
    });
});

module.exports = router;
