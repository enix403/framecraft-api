import { StatusCodes } from "http-status-codes";
import Joi from "joi";

import { ApiRouter } from "@/lib/ApiRouter";
import { reply } from "@/lib/app-reply";
import { ApplicationError, NotFound } from "@/lib/errors";

import { User } from "@/models/user";
import { customJoi } from "@/middleware/validation";

export const router = new ApiRouter({
  pathPrefix: "/users",
  defaultTags: ["User Management"]
});

// Get all users with filtering and sorting
router.add(
  {
    path: "/",
    method: "GET",
    summary: "Get all users",
    desc: "Fetches a list of all users with filtering and sorting."
  },
  async (req, res) => {
    const query = { ...req.query };
    const filter: Record<string, any> = {};

    // Filtering logic
    if (query.email) filter.email = { $regex: query.email, $options: "i" };
    if (query.fullName)
      filter.fullName = { $regex: query.fullName, $options: "i" };
    if (query.role) filter.role = query.role;
    if (query.isActive) filter.isActive = query.isActive === "true";
    if (query.isVerified) filter.isVerified = query.isVerified === "true";
    if (query.gender) filter.gender = query.phoneCountryCode;
    if (query.phoneNumber) filter.phoneNuquery.gender;
    if (query.dateOfBirth)
      filter.dateOfBirth = new Date(query.dateOfBirth as string);
    if (query.phoneCountryCode) filter.phoneCountryCodember = query.phoneNumber;
    if (query.addressCountry) filter.addressCountry = query.addressCountry;
    if (query.addressCity) filter.addressCity = query.addressCity;
    if (query.addressArea) filter.addressArea = query.addressArea;
    if (query.addressZip) filter.addressZip = query.addressZip;

    const users = await User.find(filter).sort({ createdAt: -1 });
    return reply(res, users);
  }
);

// Get a user by ID
router.add(
  {
    path: "/:id",
    method: "GET",
    summary: "Get user by ID",
    desc: "Fetches a user by their unique ID.",
    schema: {
      params: Joi.object({
        id: Joi.string().required()
      })
    }
  },
  async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFound();
    return reply(res, user);
  }
);

// Create a new user
// router.add(
//   {
//     path: "/",
//     method: "POST",
//     summary: "Create a new user",
//     desc: "Creates a new user with provided details.",
//     schema: {
//       body: Joi.object({
//         email: Joi.string().email().required(),
//         passwordHash: Joi.string().required(),
//         fullName: Joi.string().required(),
//         role: Joi.string().valid("admin", "user").required(),
//         isActive: Joi.boolean(),
//         isVerified: Joi.boolean(),
//         bio: Joi.string().optional(),
//         gender: Joi.string().valid("male", "female").optional(),
//         dateOfBirth: Joi.date().optional(),
//         phoneCountryCode: Joi.string().optional(),
//         phoneNumber: Joi.string().optional(),
//         addressCountry: Joi.string().optional(),
//         addressCity: Joi.string().optional(),
//         addressArea: Joi.string().optional(),
//         addressZip: Joi.string().optional(),
//       }),
//     },
//   },
//   async (req, res) => {
//     const user = new User(req.body);
//     await user.save();
//     return reply(res, user);
//   }
// );

// Update a user
router.add(
  {
    path: "/:id",
    method: "PATCH",
    summary: "Update user details",
    desc: "Updates a user with new details.",
    schema: {
      params: Joi.object({ id: Joi.string().required() }),
      body: Joi.object({
        email: Joi.string().email().optional(),
        fullName: Joi.string().optional(),
        role: Joi.string().valid("admin", "user").optional(),
        isActive: Joi.boolean().optional(),
        isVerified: Joi.boolean().optional(),
        bio: Joi.string().optional(),
        gender: Joi.string().valid("male", "female").optional(),
        dateOfBirth: Joi.date().optional(),
        phoneCountryCode: Joi.string().optional(),
        phoneNumber: Joi.string().optional(),
        addressCountry: Joi.string().optional(),
        addressCity: Joi.string().optional(),
        addressArea: Joi.string().optional(),
        addressZip: Joi.string().optional()
      })
    }
  },
  async (req, res) => {
    const { email } = req.body;

    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApplicationError(
          "Email already registered",
          StatusCodes.CONFLICT,
          "email_taken"
        );
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!user) throw new NotFound();
    return reply(res, user);
  }
);

// Batch delete users
router.add(
  {
    path: "/batch-delete",
    method: "DELETE",
    summary: "Batch delete users",
    desc: "Deletes multiple users by their IDs.",
    schema: {
      body: Joi.object({
        ids: Joi.array().items(customJoi.id())
      })
    }
  },
  async (req, res) => {
    const { ids } = req.body;
    const result = await User.deleteMany({ _id: { $in: ids } });
    return reply(res, {
      message: `${result.deletedCount} users deleted successfully`
    });
  }
);

// Delete a user
router.add(
  {
    path: "/:id",
    method: "DELETE",
    summary: "Delete a user",
    desc: "Removes a user by their ID.",
    schema: {
      params: Joi.object({ id: Joi.string().required() })
    }
  },
  async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new NotFound();
    return reply(res, { message: "User deleted successfully" });
  }
);


export default router;
