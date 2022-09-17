const express = require("express");
const router = express.Router();
const os = require("os");

router.get("/", (req, res) => {
  res.json({
    free: os.freemem(),
    total: os.totalmem(),
    percentage: (os.freemem() / os.totalmem()) * 100,
  });
});

module.exports = router;
