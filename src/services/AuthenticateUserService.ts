import axios from "axios";
import prismaClient from "../prisma";
import { sign } from "jsonwebtoken";

interface IAccessTokenResponse {
  access_token: string;
}

interface IUserResponse {
  id: number;
  name: string;
  login: string;
  avatar_url: string;
}

class AuthenticateUserService {
  async execute(code: string) {
    const url = "http://github.com/login/oauth/access_token";

    const { data: accessTokenResponse } =
      await axios.post<IAccessTokenResponse>(url, null, {
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },

        headers: {
          Accept: "application/json",
        },
      });

    const response = await axios.get<IUserResponse>(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `Bearer ${accessTokenResponse.access_token}`,
        },
      }
    );

    const { avatar_url, login, name, id } = response.data;

    let user = await prismaClient.user.findFirst({
      where: {
        github_id: id,
      },
    });

    if (!user) {
      user = await prismaClient.user.create({
        data: {
          github_id: id,
          name,
          login,
          avatar_url,
        },
      });

      const token = sign(
        {
          user: {
            name: user.name,
            avatar: user.avatar_url,
            id: user.id,
          },
        },
        process.env.JWT_SECRET,
        {
          subject: user.id,
          expiresIn: "1d",
        }
      );

      return { token, user };
    }
  }
}

export { AuthenticateUserService };
