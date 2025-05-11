import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

import { ApiRouter } from "@/lib/ApiRouter";
import { appEnv } from "@/lib/app-env";
import { reply } from "@/lib/app-reply";
import { ApplicationError } from "@/lib/errors";

import { authGuard } from "@/guards/auth.guard";

cloudinary.config({
  cloud_name: appEnv.CLOUDINARY_CLOUD_NAME,
  api_key: appEnv.CLOUDINARY_API_KEY,
  api_secret: appEnv.CLOUDINARY_API_SECRET,
  secure: true
});

export const upload = multer({
  storage: multer.memoryStorage()
});

export const router = new ApiRouter({
  pathPrefix: "/uploads",
  defaultTags: ["Uploads"]
});

router.add(
  {
    path: "/",
    method: "POST",
    summary: "Upload Files",
    desc: "Uploads multiple files to Cloudinary. Accepts up to 10 files through a multipart/form-data request. Returns the list of secure URLs for the uploaded files.",
    middlewares: [authGuard(), upload.array("files", 10)]
  },
  async (req, res) => {
    const files = req.files as Express.Multer.File[];

    try {
      const uploadedUrls = await Promise.all(
        files.map(
          file =>
            new Promise<string>((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { folder: "superapp" },
                (err, result) => {
                  if (err || !result) reject(err);
                  else resolve(result.secure_url);
                }
              );
              stream.end(file.buffer);
            })
        )
      );
      return reply(res, uploadedUrls);
    } catch (err) {
      console.log(err);
      throw new ApplicationError("Failed to upload files");
    }
  }
);
