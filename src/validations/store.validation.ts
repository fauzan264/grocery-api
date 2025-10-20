import * as yup from "yup";

export const createAssignStoreAdminSchema = yup.object().shape({
  user_id: yup.string().required("User is required"),
});
