import * as yup from "yup";

const maximumFileSize = 1024 * 1024;
const fileFormatAccepted = ["image/jpeg", "image/png", "image/gif"];

export const createAddressesSchema = yup.object().shape({
  province_id: yup.number().required("Province is required"),
  city_id: yup.number().required("City is required"),
  district_id: yup.number().required("District is required"),
  address: yup.string().required("Address is required"),
  latitude: yup.string().required("Latitude is required"),
  longitude: yup.string().required("Longitude is required"),
  is_default: yup.bool().required("Default is required"),
});

export const updateAddressesSchema = yup.object().shape({
  province_id: yup.number(),
  city_id: yup.number(),
  district_id: yup.number(),
  address: yup.string(),
  latitude: yup.string(),
  longitude: yup.string(),
  is_default: yup.bool(),
});

export const updateMyProfileSchema = yup.object().shape({
  full_name: yup.string(),
  date_of_birth: yup
    .date()
    .transform((value, originalValue) => {
      if (originalValue && typeof originalValue === "string") {
        return new Date(originalValue);
      }
      return value;
    })
    .max(new Date(), "Date of birth cannot be in the future"),
  phone_number: yup.string(),
  photo_profile: yup
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
