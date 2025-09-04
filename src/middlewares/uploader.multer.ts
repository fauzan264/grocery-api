import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";

export const uploaderMulter = (
  acceptedFile: String[],
  storageOption: string
) => {
  const storage =
    storageOption === "diskStorage"
      ? multer.diskStorage({
          destination: function (_, __, cb) {
            const mainDirectory = path.join(process.cwd());
            cb(null, `${mainDirectory}/src/public`);
          },
          filename: function (_, file, cb) {
            const extensionFile = file?.mimetype?.split("/")[1];
            const uniqueSuffix =
              "IMG-" +
              Date.now +
              "-" +
              Math.round(Math.random() * 1e9) +
              `.${extensionFile}`;
            cb(null, file.fieldname + "-" + uniqueSuffix);
          },
        })
      : multer.memoryStorage();

  const fileFilter = (
    _: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (!acceptedFile.includes(file?.mimetype?.split("/")[0]))
      cb(new Error("File type not accept"));
    cb(null, true);
  };

  return multer({ storage, fileFilter });
};
