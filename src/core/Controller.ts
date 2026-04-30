import { NextResponse,NextRequest } from "next/server";
import * as yup from "yup";

/**
 * Type definition for resources used in controllers.
 * Every resource can optionally define `initResponse` to transform results.
 */
interface ResourceContract {
  initResponse?: (data: unknown, req?: Request) => Promise<unknown> | unknown;
}

export default abstract class Controller {
  protected __is_error = false;
  protected __is_paginate = true;
  protected __collection = true;

  protected __request?: Request;
  protected __response?: NextResponse;
  protected __params?: Record<string, string | number>;
  protected __resource = "";

  constructor(req?: NextRequest) {
    this.__is_error = false;
    if (req) {
      this.__request = req;
    }
  }

  // ----------------- VALIDATION -----------------
  protected async __validate<T extends Record<string, unknown>>(
    schema: yup.AnyObjectSchema,
    data: T
  ): Promise<
    | { success: true; data: T }
    | { success: false; errors?: Record<string, string>; message: string; status: number }
  > {
    try {
      const validated = (await schema.validate(data, { abortEarly: false })) as T;
      this.__is_error = false;
      return { success: true, data: validated };
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) errors[e.path] = e.message;
        });
        this.__is_error = true;
        return { success: false, errors, message: "Validation failed", status: 422 };
      }
      this.__is_error = true;
      return { success: false, message: (err as Error).message, status: 500 };
    }
  }

  // ----------------- RESPONSE HANDLERS -----------------
  protected async __sendResponse<T extends Record<string, unknown> | unknown[]>(
    status = 200,
    message = "success",
    data: T | { data?: T; meta?: Record<string, number> } = {} as T
  ): Promise<NextResponse> {
    try {
      const links = this.paginateLinks(data);
      let results: unknown = this.__is_paginate
        ? (data as { data?: T }).data ?? []
        : data;

      if (this.__collection && this.__resource) {
        const resource = (await this.loadResource()) as ResourceContract | null;
        if (resource?.initResponse) {
          results = await resource.initResponse(results, this.__request);
        }
      }

      return NextResponse.json({ code: status, message, data: results, links }, { status });
    } catch (error) {
      return this.sendError((error as Error).message, {}, 500);
    }
  }

  protected sendError(
    message = "Validation Message",
    errors: Record<string, unknown> = {},
    status = 400
  ): NextResponse {
    this.__is_error = true;
    return NextResponse.json({ code: status, message, data: errors }, { status });
  }

  // ----------------- PAGINATION -----------------
  protected paginateLinks(
    data: unknown
  ): Record<string, number | null> | Record<string, null> {
    if (
      !this.__is_paginate ||
      typeof data !== "object" ||
      data === null ||
      !("meta" in data)
    ) {
      return { first: null, last: null, prev: null, next: null };
    }

    const meta = (data as { meta: Record<string, number> }).meta;
    return {
      total: meta.total,
      per_page: meta.per_page,
      current_page: meta.current_page,
      last_page: meta.last_page,
      prev: meta.current_page > 1 ? meta.current_page - 1 : null,
      next: meta.current_page < meta.last_page ? meta.current_page + 1 : null,
    };
  }

  // ----------------- RESOURCE LOADER -----------------
  protected async loadResource(): Promise<ResourceContract | null> {
    try {
      if (!this.__resource) return null;
      const imported = await import(`@/resources/${this.__resource}`);
      const ResourceClass = imported.default;
      return new ResourceClass() as ResourceContract;
    } catch (error) {
      console.error("⚠️ Resource load failed:", error);
      return null;
    }
  }

  // ----------------- HELPER -----------------
  protected setValidatorMessagesResponse(
    messages: { errors?: Record<string, string> }
  ): Record<string, string> {
    const errorMessages: Record<string, string> = {};
    if (messages?.errors) {
      Object.entries(messages.errors).forEach(([field, msg]) => {
        errorMessages[field] = msg;
      });
    }
    return errorMessages;
  }
  
}
