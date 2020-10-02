import { Request, Response } from "express";
import { twitchService } from "../services/twitch-service";

const NOT_FOUND_RESPONSE = {
  error: "Not found",
  message: "Can't find channel.",
  status: 404,
};

class ChannelController {
  public async getChannelDetails(req: Request, res: Response) {
    const channelIdOrName = req.params.channelId;

    const channelInfo = await twitchService.getChannelInfo(channelIdOrName);

    if (channelInfo == null) {
      res.status(404).json(NOT_FOUND_RESPONSE);
      return;
    }

    res.json(channelInfo);
  }
}

const channelController = new ChannelController();
export default channelController;
