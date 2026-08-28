const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("colyseus");
const { monitor } = require("@colyseus/monitor");
const { DuelRoom } = require("./DuelRoom");

// Cloud Run injects PORT; always bind to it (and to 0.0.0.0, not localhost).
const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// Basic room-monitor dashboard at /colyseus — remove or auth-gate before
// exposing this publicly in production.
app.use("/colyseus", monitor());

const httpServer = http.createServer(app);

const gameServer = new Server({ server: httpServer });
gameServer.define("duel", DuelRoom);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`HeavenlyBound duel server listening on 0.0.0.0:${PORT}`);
});
