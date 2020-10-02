import { Router } from "express";
import channelController from "./controllers/channel-controller";

class ApiRoutes {
  public router: Router = Router();

  constructor() {
    this.config();
  }

  private config(): void {
    this.router.get("/channel/:channelId", channelController.getChannelDetails);
  }
}

export const apiRouter = new ApiRoutes().router;
