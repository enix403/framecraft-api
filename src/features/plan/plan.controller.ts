import { StatusCodes } from "http-status-codes";
import Joi from "joi";

import { ApiRouter } from "@/lib/ApiRouter";
import { reply } from "@/lib/app-reply";
import { ApplicationError, NotFound } from "@/lib/errors";
import { appLogger } from "@/lib/logger";

import { authGuard } from "@/guards/auth.guard";

import { customJoi } from "@/middleware/validation";

import { Plan, PlanCanvas } from "@/models/plan";
import { User } from "@/models/user";

import { generateCanvasData } from "./plan.service";

export const router = new ApiRouter({
  pathPrefix: "/plan",
  defaultTags: ["Floor Plan"]
});

router.add(
  {
    path: "/generate",
    method: "POST",
    schema: {
      body: Joi.object({
        name: Joi.string(),
        plotWidth: Joi.number(),
        plotLength: Joi.number(),
        plotMeasureUnit: Joi.string(),
        layout: Joi.object({
          nodes: Joi.array().items(
            Joi.object({
              label: Joi.string(),
              typeId: Joi.number().integer(),
              position: Joi.object({
                x: Joi.number(),
                y: Joi.number()
              })
            })
          ),
          edges: Joi.array().items(
            Joi.array().ordered(Joi.number().integer(), Joi.number().integer())
          )
        })
      })
    },
    middlewares: [authGuard()]
  },
  async (req, res) => {
    const userId = req.user.id;

    const canvasData = await generateCanvasData(req.body.layout);

    const plan = await new Plan({
      userId,
      ...req.body,
      settings: {
        unit: req.body.plotMeasureUnit
      }
    }).save();

    const planCanvas = await new PlanCanvas({
      userId,
      planId: plan._id,
      canvasData
    }).save();

    return reply(res, {
      plan,
      planCanvas
    });
  }
);

router.add(
  {
    path: "/all",
    method: "GET",
    schema: {
      /* TODO sort and filter */
    },
    middlewares: [authGuard()]
  },
  async (req, res) => {
    const plans = await Plan.find({
      userId: req.user.id
    })
      .sort({ createdAt: -1 })
      .populate("canvas");
    return reply(res, plans);
  }
);

router.add(
  {
    path: "/:planId",
    method: "GET",
    schema: {
      params: Joi.object({
        planId: customJoi.id()
      })
    },
    middlewares: [authGuard()]
  },
  async (req, res) => {
    const plan = await Plan.findOne({
      _id: req.params.planId,
      userId: req.user.id
    }).populate("canvas");
    if (!plan) throw new NotFound();
    return reply(res, plan);
  }
);

router.add(
  {
    path: "/:planId",
    method: "POST",
    schema: {
      params: Joi.object({
        planId: customJoi.id()
      }),
      body: Joi.object({
        name: Joi.string(),
        layout: Joi.object({
          nodes: Joi.array().items(
            Joi.object({
              label: Joi.string(),
              typeId: Joi.number().integer()
            })
          )
        }),
        settings: Joi.object({
          unit: Joi.string(),
          enableWallMeasure: Joi.boolean(),
          enableRoomLabels: Joi.boolean()
        })
      }).or("name", "layout", "settings")
    },
    middlewares: [authGuard()]
  },
  async (req, res) => {
    const updatedPlan = await Plan.findOneAndUpdate(
      {
        _id: req.params.planId,
        userId: req.user.id
      },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedPlan) throw new NotFound();
    return reply(res, updatedPlan);
  }
);

router.add(
  {
    path: "/canvas/:canvasId",
    method: "POST",
    schema: {
      params: Joi.object({
        canvasId: customJoi.id()
      }),
      body: Joi.object({
        canvasData: Joi.object()
      })
    },
    middlewares: [authGuard()]
  },
  async (req, res) => {
    const updatedCanvas = await PlanCanvas.findOneAndUpdate(
      {
        _id: req.params.canvasId,
        userId: req.user.id
      },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedCanvas) throw new NotFound();
    return reply(res, updatedCanvas);
  }
);
