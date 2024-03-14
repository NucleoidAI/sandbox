const router = require("express").Router();
const uuid = require("uuid").v4;
const axios = require("axios").default;
const metrics = require("./metrics");
const terminal = require("./terminal");
const map = require("../map");
const nucleoid = require("../nucleoid");
const port = require("../port");

router.use("/metrics", metrics);
router.use("/terminal", terminal);

router.post("/", async (req, res) => {
  const id = uuid();
  const terminal = port.inc();

  const instance = await nucleoid.start(id, { terminal });

  const openapi = port.inc();
  instance.openapi = openapi;

  axios
    .post(`http://localhost:${terminal}/openapi`, {
      ...req.body,
      action: "start",
      port: openapi,
      prefix: `/sandbox/${id}`,
    })
    .then(() => {
      console.log(
        `Start process with ${id} - terminal: ${terminal}, openapi: ${openapi}`
      );

      res.json({ id });
    })
    .catch((err) => {
      console.log(`There is an error while starting OpenAPI in ${id}`);
      res.status(500).send(err);
    });
});

router.all("/:id*", (req, res) => {
  const { id } = req.params;
  const { method, body, url } = req;

  const sandbox = map.get(id);

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
