import * as yup from "yup";

/**
 * Validates data using a Yup schema and returns a standardized response.
 */
export async function validate<T extends Record<string, unknown>>(
  schema: yup.ObjectSchema<T>,
  data: unknown
): Promise<
  | { success: true; data: T }
  | { success: false; message: string; errors: Record<string, string>; status: number }
> {
  try {
    const validated = await schema.validate(data, { abortEarly: false });
    return { success: true, data: validated as T };
  } catch (err) {
    const errors: Record<string, string> = {};

    if (err instanceof yup.ValidationError) {
      if (err.inner && err.inner.length) {
        for (const e of err.inner) {
          if (e.path) errors[e.path] = e.message;
        }
      } else if (err.path) {
        errors[err.path] = err.message;
      }

      return {
        success: false,
        message: "Validation Error",
        errors,
        status: 422,
      };
    }

    // fallback for unexpected runtime errors
    return {
      success: false,
      message: (err as Error).message || "Unknown Error",
      errors,
      status: 500,
    };
  }
}
