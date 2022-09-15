const router = require("express").Router();
const { spawn } = require("child_process");
const uuid = require("uuid").v4;
const { post } = require("axios").default;

let port = 4000;

router.post("/sandbox", async (req, res) => {
  const id = uuid(); //.replaceAll("-", "");
  const terminal = port++;

  const nuc = spawn("nuc", ["start", "--id", id, "--port", terminal], {
    shell: true,
  });

  nuc.stdout.on("data", async () => {
    const openapi = port++;

    post(`http://localhost:${terminal}/openapi`, {
      ...req.body,
      action: "start",
      port: openapi,
    })
      .then(() => res.json({ id }))
      .catch((err) => res.status(500).send(err));
  });

  nuc.stderr.on("data", (data) => {
    res.status(500).send(data);
  });
});

module.exports = router;
