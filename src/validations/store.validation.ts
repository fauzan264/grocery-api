import * as yup from "yup";

const maximumFileSize = 1024 * 1024;
const fileFormatAccepted = ["image/jpeg", "image/png", "image/gif"];

export const createAssignStoreAdminSchema = yup.object().shape({
  user_id: yup.string().required("User is required"),
});

export const createStoreSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  description: yup.string().required("Description is required"),
  province_id: yup.number().required("Province is required"),
  city_id: yup.number().required("City is required"),
  district_id: yup.number().required("District is required"),
  address: yup.string().required("Address is required"),
  latitude: yup.string().required("Latitude is required"),
  longitude: yup.string().required("Longitude is required"),
  logo: yup
    .mixed<Express.Multer.File>()
    .required("Logo is required")
    .test("fileSize", "Maximum file is 1 MB", (file) => {
      if (!file) return false;
      return file.size <= maximumFileSize;
    })
    .test("fileFormat", "Format file not accepted", (file) => {
      if (!file) return false;
      return fileFormatAccepted.includes(file.mimetype);
    }),
});

export const updateStoreSchema = yup.object().shape({
  name: yup.string(),
  description: yup.string(),
  province_id: yup.number(),
  city_id: yup.number(),
  district_id: yup.number(),
  address: yup.string(),
  latitude: yup.string(),
  longitude: yup.string(),
  logo: yup
    .mixed<Express.Multer.File>()
    .nullable()
    .test("fileSize", "Maximum file is 1 MB", (file) => {
      if (!file) return true;
      return file.size <= maximumFileSize;
    })
    .test("fileFormat", "Format file not accepted", (file) => {
      if (!file) return true;
      return fileFormatAccepted.includes(file.mimetype);
    }),
});
