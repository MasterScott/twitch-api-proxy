import * as bodyParser from "body-parser";
import express from "express";
import RateLimit from "express-rate-limit";
import { apiRouter } from "./api-router";

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set("trust proxy", 1);

const rateLimiter = new RateLimit({
  windowMs: 5 * 60000, // 5 minutes
  max: 50,
  message: {
    error: "Too many requests",
    message: "Too many requests, please try again later.",
    status: 429,
  },
});

app.use(rateLimiter);

app.use("/v1", apiRouter);

app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }
  return console.log(`TwitchApiProxy is listening on ${port}`);
});
