const router = require("express").Router();
const uuid = require("uuid").v4;
const axios = require("axios").default;
const map = require("../map");
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
      action: "start",
      port: openapi,
      prefix: `/sandbox/${sessionId}`,
    })
    .then(() => {
      console.log(
        `Start process with ${sessionId} - terminal: ${terminal}, openapi: ${openapi}`
      );

      res.json({ id: sessionId });
    })
    .catch((err) => {
      console.log(`There is an error while starting OpenAPI in ${sessionId}`);
      res.status(500).send(err);
    });
});

router.all("*", (req, res) => {
  const { sessionId } = req.params;
  const { method, body, url } = req;

  const sandbox = map.get(sessionId);

  if (!sandbox) {
    res.status(404).end();
    return;
  }

  const { openapi } = sandbox;

  axios({
    method,
    url: `http://localhost:${openapi}/sandbox${url}`,
    data: body,
    transformResponse: (x) => x,
  })
    .then(({ headers, status, data }) =>
      res.set(headers).status(status).send(data)
    )
    .catch((err) => {
      if (err.response) {
        const { headers, status, data } = err.response;
        res.set(headers).status(status).send(data);
      } else {
        res.status(500).json({
          message: err.message,
        });
      }
    });
});

module.exports = router;
