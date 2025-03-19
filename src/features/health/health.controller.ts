import ApiRouter from "@/lib/ApiRouter";
import { reply } from "@/lib/app-reply";
import { customJoi } from "@/middleware/validation";

import { DisposableToken } from "@/models/disposable-token";
import { User } from "@/models/user";
import Joi from "joi";

export const router = new ApiRouter();

router.add(
  {
    path: "/health",
    method: "GET",
    schema: {
      query: Joi.object({
        username: customJoi.id(),
        password: Joi.string()
      }),
      body: Joi.object({
        username: customJoi.id()
      })
    }
  },
  async (req, res) => {
    return reply(res, {
      live: true,
      query: req.query
    });
  }
);

router.add(
  {
    path: "/temp",
    method: "GET"
  },
  async (req, res) => {
    await User.deleteMany({});
    await DisposableToken.deleteMany({});

    return reply(res, { ok: true });
  }
);
