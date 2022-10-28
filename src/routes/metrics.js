const express = require("express");
const router = express.Router();
const os = require("os");
const map = require("../map");

router.get("/", (req, res) => {
  const free = os.freemem();
  const total = os.totalmem();
  res.json({
    free,
    total,
    percentage: ((total - free) / total) * 100,
    size: map.size,
  });
});

module.exports = router;
