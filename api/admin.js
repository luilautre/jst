const express = require("express");
const fs = require("fs");
const path = require("path");

function startAdmin({ key = "devkey", port = 3030 } = {}) {
  const app = express();
  app.use(express.json());

  // Protection simple
  app.use((req, res, next) => {
    if (req.query.key !== key) {
      return res.status(403).send("Accès refusé");
    }
    next();
  });

  // Interface HTML
  app.get("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "admin/admin.html"));
  });

  // variables.json
  app.get("/variables", (req, res) => {
    res.json(JSON.parse(fs.readFileSync("variables.json", "utf8")));
  });

  app.post("/variables", (req, res) => {
    fs.writeFileSync("variables.json", JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  });

  // functions.js
  app.get("/functions", (req, res) => {
    res.sendFile(path.join(process.cwd(), "functions.js"));
  });

  app.post("/functions", (req, res) => {
    fs.writeFileSync("functions.js", req.body.code);
    res.json({ ok: true });
  });

  app.listen(port, () => {
    console.log(`JST Admin running at http://localhost:${port}/?key=${key}`);
  });
}

module.exports = { startAdmin };
