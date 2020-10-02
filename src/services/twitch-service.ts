import axios from "axios";
import moment from "moment";
import NodeCache from "node-cache";

const FIREBOT_CLIENT_ID = "umhhyrvkdriayr0psc3ttmsnq2j8h0";
const FIREBOT_SECRET = "z681sr828rf5ql70ilpf3sk3ein9v7";

type OneOf<T extends any[]> = T[0];

interface ChannelInfo {
  userId: string;
  username: string;
  displayName: string;
  profilePicUrl: string;
  isLive: boolean;
  description: string;
  viewerCount: number;
  streamTitle: string;
}

interface AuthData {
  token: string;
  expiresAt: ReturnType<typeof moment>;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: "bearer";
}

interface GetUserResponse {
  data: Array<{
    id: string;
    login: string;
    display_name: string;
    description: string;
    profile_image_url: string;
  }>;
}
interface GetStreamsResponse {
  data: Array<{
    id: string;
    game_id: string;
    title: string;
    viewer_count: number;
    thumbnail_url: string;
  }>;
}

class TwitchService {
  private bearerToken: AuthData = null;
  private channelCache = new NodeCache({ stdTTL: 10 });
  private async getBearerToken(): Promise<string | null> {
    if (this.bearerToken != null) {
      const tomorrow = moment().add(24, "hours");
      if (tomorrow.isBefore(this.bearerToken.expiresAt)) {
        return this.bearerToken.token;
      }
    }
    const response = await axios.post<TokenResponse>(`
      https://id.twitch.tv/oauth2/token?client_id=${FIREBOT_CLIENT_ID}&client_secret=${FIREBOT_SECRET}&grant_type=client_credentials
      `);
    if (response.status === 200) {
      this.bearerToken = {
        token: response.data.access_token,
        expiresAt: moment().add(response.data.expires_in, "seconds"),
      };
      return response.data.access_token;
    } else {
      return null;
    }
  }

  private async getStreamData(
    bearerToken: string,
    userId: string
  ): Promise<OneOf<GetStreamsResponse["data"]>> {
    const getStreamResponse = await axios.get<GetStreamsResponse>(
      `https://api.twitch.tv/helix/streams?user_id=${userId}`,
      {
        headers: {
          "Client-Id": FIREBOT_CLIENT_ID,
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );
    if (
      getStreamResponse.status !== 200 ||
      !getStreamResponse.data.data.length
    ) {
      return null;
    }
    return getStreamResponse.data.data[0];
  }

  private async getUserData(
    bearerToken: string,
    channelName: string
  ): Promise<OneOf<GetUserResponse["data"]>> {
    const getUserResponse = await axios.get<GetUserResponse>(
      `https://api.twitch.tv/helix/users?login=${channelName}`,
      {
        headers: {
          "Client-Id": FIREBOT_CLIENT_ID,
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );
    if (getUserResponse.status !== 200 || !getUserResponse.data.data.length) {
      return null;
    }
    return getUserResponse.data.data[0];
  }

  public async getChannelInfo(channelName: string): Promise<ChannelInfo> {
    if (channelName == null || channelName.length < 1) {
      return null;
    }
    channelName = channelName.toLowerCase();
    const cached = this.channelCache.get<ChannelInfo>(channelName);
    if (cached) {
      return cached;
    }
    const bearerToken = await this.getBearerToken();
    if (bearerToken == null) {
      return null;
    }

    const userInfo = await this.getUserData(bearerToken, channelName);

    if (userInfo === null) {
      return null;
    }

    const streamInfo = await this.getStreamData(bearerToken, userInfo.id);

    const channelInfo: ChannelInfo = {
      userId: userInfo.id,
      username: userInfo.login,
      displayName: userInfo.display_name,
      description: userInfo.description,
      profilePicUrl: userInfo.profile_image_url,
      isLive: streamInfo != null,
      viewerCount: streamInfo?.viewer_count ?? 0,
      streamTitle: streamInfo?.title,
    };

    this.channelCache.set(channelName, channelInfo);

    return channelInfo;
  }
}

export const twitchService = new TwitchService();
