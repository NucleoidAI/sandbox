const express = require("express");
const router = express.Router();
const os = require("os");

router.get("/", (req, res) => {
  const free = os.freemem();
  const total = os.totalmem();
  res.json({
    free,
    total,
    percentage: ((total - free) / total) * 100,
  });
});

module.exports = router;
