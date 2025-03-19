import Joi from "joi";

import { ApiRouter } from "@/lib/ApiRouter";
import { reply } from "@/lib/app-reply";

import { customJoi } from "@/middleware/validation";

import { DisposableToken } from "@/models/disposable-token";
import { User } from "@/models/user";

export const router = new ApiRouter({
  defaultTags: ["Health & Monitoring"]
});

router.add(
  {
    path: "/health",
    method: "GET"
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
    method: "POST"
  },
  async (req, res) => {
    await User.deleteMany({});
    await DisposableToken.deleteMany({});

    return reply(res, { ok: true });
  }
);
