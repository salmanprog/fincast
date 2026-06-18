import * as yup from "yup";

export const storePlan = yup.object({
  title: yup.string().required("Title is required").min(2).max(255),
  description: yup.string().nullable().optional(),
  amount: yup.number().integer().min(1).required("Amount is required"),
  credits: yup.number().integer().min(0).required("Credits is required"),
  status: yup.boolean().default(true),
});

export const updatePlan = yup.object({
  title: yup.string().min(2).max(255).optional(),
  description: yup.string().nullable().optional(),
  amount: yup.number().integer().min(1).optional(),
  credits: yup.number().integer().min(0).optional(),
  status: yup.boolean().optional(),
});
