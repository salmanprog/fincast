import { NextResponse } from "next/server";
import Controller from "./Controller";

type PrismaCompatibleModel = {
  findMany: (...args: unknown[]) => Promise<unknown>;
  findUnique?: (...args: unknown[]) => Promise<unknown>;
  create?: (...args: unknown[]) => Promise<unknown>;
  update?: (...args: unknown[]) => Promise<unknown>;
  delete?: (...args: unknown[]) => Promise<unknown>;
};

export interface QueryHook<TQuery = Record<string, unknown>, TRequest = Record<string, unknown>> {
  indexQueryHook?(query: TQuery, request?: TRequest): Promise<TQuery>;
  showQueryHook?(query: TQuery, request?: TRequest): Promise<TQuery>;
  beforeCreateHook?(query: TQuery, request?: TRequest): Promise<TQuery>;
}

export default abstract class RestController<
  TModel = unknown,
  TEntity extends Record<string, unknown> = Record<string, unknown>,
  THook extends QueryHook = QueryHook
> extends Controller {
  protected model: TModel & PrismaCompatibleModel;
  protected hook?: THook;
  protected resource:
    | (new () => {
        collection?: (records: TEntity[]) => Promise<unknown>;
        toArray?: (record: TEntity) => Promise<unknown>;
      })
    | null = null;

  protected messages: Record<string, string> = {
    list: "Records fetched successfully",
    store: "Record created successfully",
    show: "Record fetched successfully",
    update: "Record updated successfully",
    delete: "Record deleted successfully",
  };

  protected data: Partial<TEntity> | null = null;
  protected user: Record<string, any> | null = null;
  constructor(model: TModel & PrismaCompatibleModel, req?: Request) {
    super();
    this.model = model;
    if (req) this.__request = req;
    this.user = this.safeParseUser();
  }

  // ---------- Hooks ----------
  protected async validation(
    action?: string
  ): Promise<
    | { success: true; data?: Partial<TEntity> }
    | { success: false; errors?: Record<string, string>; message: string; status: number }
    | void
  > {
    // reference `action` so linters won't complain about unused param
    if (!action) return;
    return;
  }

  protected async beforeIndex(): Promise<NextResponse | void> {
    return;
  }
  protected async afterIndex(records: TEntity[]): Promise<TEntity[]> {
    return records;
  }

  protected async beforeStore(): Promise<NextResponse | void> {
    return;
  }
  protected async afterStore(record: TEntity): Promise<TEntity> {
    return record;
  }

  protected async beforeShow(): Promise<NextResponse | void> {
    return;
  }
  protected async afterShow(record: TEntity): Promise<TEntity> {
    return record;
  }

  protected async beforeUpdate(): Promise<NextResponse | void> {
    return;
  }
  protected async afterUpdate(record: TEntity): Promise<TEntity> {
    return record;
  }

  protected async beforeDestroy(): Promise<NextResponse | void> {
    return;
  }
  protected async afterDestroy(): Promise<void> {
    return;
  }
  
 
 protected async getQueryHook(
  action: string,
  query: Record<string, unknown>,
  request?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const actionMap: Record<string, keyof THook> = {
    index: "indexQueryHook",
    show: "showQueryHook",
    beforeCreate: "beforeCreateHook",
    // add more mappings if needed
  };

  const hookKey = actionMap[action];
  if (!hookKey) return query;

  const fn = this.hook?.[hookKey];
  if (typeof fn === "function") {
    return fn(query, request) as Promise<Record<string, unknown>>;
  }
  return query;
}

  // ---------- CRUD ----------
  private safeParseUser<T = any>(): T | null {
    try {
      const header =
        this.__request?.headers?.get?.("x-current-user");
      if (!header) return null;
      return JSON.parse(header) as T;
    } catch (err) {
      console.warn("⚠️ Failed to parse x-current-user header:", err);
      return null;
    }
  }
  async index(): Promise<NextResponse> {
    try {
      await this.beforeIndex();
      let query: Record<string, unknown> = {};
      const requestData: Record<string, unknown> = this.__request
        ? {
            query: Object.fromEntries(new URL(this.__request.url).searchParams),
            headers: Object.fromEntries(this.__request.headers.entries()),
            method: this.__request.method,
          }
        : {};
      query = await this.getQueryHook("index", query, requestData);

      const records = (await this.model.findMany(query)) as TEntity[];
        const processed = await this.afterIndex(records);
        return this.__sendResponse(200, this.messages.list, processed);
    } catch (err) {
      return this.sendError((err as Error).message, {}, 500);
    }
  }

  async store(data: Partial<TEntity>): Promise<NextResponse> {
    this.data = data;
    const validation = await this.validation("store");
    if (validation && "success" in validation && !validation.success)
      return this.sendError("Validation failed", validation.errors ?? {}, 422);

    try {
        const beforeResponse = await this.beforeStore();
        if (beforeResponse) return beforeResponse;
        const requestData: Record<string, unknown> = this.__request
          ? {
              query: Object.fromEntries(new URL(this.__request.url).searchParams),
              headers: Object.fromEntries(this.__request.headers.entries()),
              method: this.__request.method,
            }
          : {};
        const hookData = await this.getQueryHook("beforeCreate", {}, requestData);
        delete hookData.id;
        const finalData = { ...data, ...hookData };
        const create = (await this.model.create?.({ data: finalData })) as TEntity;
        let query: Record<string, unknown> = {};

        const requestDataShow: Record<string, unknown> = this.__request
          ? {
              query: Object.fromEntries(new URL(this.__request.url).searchParams),
              headers: Object.fromEntries(this.__request.headers.entries()),
              method: this.__request.method,
            }
          : {};
      query = await this.getQueryHook("show", query, requestDataShow);
      query.where = { ...(query.where || {}), id: Number(create.id) };
      const record = (await this.model.findUnique?.(query)) as TEntity;
      const processed = await this.afterStore(record);
      return this.__sendResponse(200, this.messages.store, processed);
    } catch (err) {
      return this.sendError((err as Error).message, {}, 500);
    }
  }

  async show(id: number): Promise<NextResponse> {
    try {
      const beforeShow = await this.beforeShow();
      if (beforeShow) return beforeShow;
      let query: Record<string, unknown> = {};
        const requestDataShow: Record<string, unknown> = this.__request
          ? {
              query: Object.fromEntries(new URL(this.__request.url).searchParams),
              headers: Object.fromEntries(this.__request.headers.entries()),
              method: this.__request.method,
            }
          : {};
      query = await this.getQueryHook("show", query, requestDataShow);
      query.where = { ...(query.where || {}), id: Number(id) };
      const record = (await this.model.findUnique?.(query)) as TEntity | null;
      if (!record) return this.sendError("Record not found", {}, 404);

      const processed = await this.afterShow(record);
      return this.__sendResponse(200, this.messages.show, processed);
    } catch (err) {
      return this.sendError((err as Error).message, {}, 500);
    }
  }

  async showSlug(slug: string): Promise<NextResponse> {
    try {
      const beforeShow = await this.beforeShow();
      if (beforeShow) return beforeShow;
      let query: Record<string, unknown> = {};
        const requestDataShow: Record<string, unknown> = this.__request
          ? {
              query: Object.fromEntries(new URL(this.__request.url).searchParams),
              headers: Object.fromEntries(this.__request.headers.entries()),
              method: this.__request.method,
            }
          : {};
      query = await this.getQueryHook("show", query, requestDataShow);
      query.where = { ...(query.where || {}), slug: String(slug) };
      const record = (await this.model.findUnique?.(query)) as TEntity | null;
      if (!record) return this.sendError("Record not found", {}, 404);

      const processed = await this.afterShow(record);
      return this.__sendResponse(200, this.messages.show, processed);
    } catch (err) {
      return this.sendError((err as Error).message, {}, 500);
    }
  }

  async update(id: number, data: Partial<TEntity>): Promise<NextResponse> {
    this.data = data;
    const validation = await this.validation("update");
    if (validation && "success" in validation && !validation.success)
      return this.sendError("Validation failed", validation.errors ?? {}, 422);

    try {
      const beforeUpdate = await this.beforeUpdate();
      if (beforeUpdate) return beforeUpdate;
      const record_updated = (await this.model.update?.({ where: { id }, data })) as TEntity;
      let query: Record<string, unknown> = {};

        const requestDataShow: Record<string, unknown> = this.__request
          ? {
              query: Object.fromEntries(new URL(this.__request.url).searchParams),
              headers: Object.fromEntries(this.__request.headers.entries()),
              method: this.__request.method,
            }
          : {};
      query = await this.getQueryHook("show", query, requestDataShow);
      query.where = { ...(query.where || {}), id: Number(record_updated.id) };
      const record = (await this.model.findUnique?.(query)) as TEntity;
      const processed = await this.afterUpdate(record);
      return this.__sendResponse(200, this.messages.update, processed);
    } catch (err) {
      return this.sendError((err as Error).message, {}, 500);
    }
  }

  async updateBySlug(slug: string, data: Partial<TEntity>): Promise<NextResponse> {
    this.data = data;

    const validation = await this.validation("update");
    if (validation && "success" in validation && !validation.success)
      return this.sendError("Validation failed", validation.errors ?? {}, 422);

    try {
      const beforeUpdate = await this.beforeUpdate();
      if (beforeUpdate) return beforeUpdate;

      const record_updated = (await this.model.update?.({ where: { slug }, data })) as TEntity;

      let query: Record<string, unknown> = {};
      const requestDataShow: Record<string, unknown> = this.__request
        ? {
            query: Object.fromEntries(new URL(this.__request.url).searchParams),
            headers: Object.fromEntries(this.__request.headers.entries()),
            method: this.__request.method,
          }
        : {};

      query = await this.getQueryHook("show", query, requestDataShow);
      query.where = { ...(query.where || {}), slug: record_updated.slug };

      const record = (await this.model.findUnique?.(query)) as TEntity;
      const processed = await this.afterUpdate(record);

      return this.__sendResponse(200, this.messages.update, processed);
    } catch (err) {
      return this.sendError((err as Error).message, {}, 500);
    }
  }

  async destroy(id: number): Promise<NextResponse> {
    try {
      await this.beforeDestroy();
      await this.model.update?.({where: { id }, data: { deletedAt: new Date() },}) as TEntity;
      await this.afterDestroy();
      return this.__sendResponse(200, this.messages.delete, {});
    } catch (err) {
      return this.sendError((err as Error).message, {}, 500);
    }
  }

  async destroyBySlug(slug: string): Promise<NextResponse> {
    try {
      await this.beforeDestroy();
      await this.model.update?.({where: { slug }, data: { deletedAt: new Date() },}) as TEntity;
      await this.afterDestroy();
      return this.__sendResponse(200, this.messages.delete, {});
    } catch (err) {
      return this.sendError((err as Error).message, {}, 500);
    }
  }

  // ---------- RESPONSE ----------
  protected async __sendResponse<T extends Record<string, unknown> | unknown[]>(
    status = 200,
    message = "success",
    data: T | { data?: T; meta?: Record<string, number> } = {} as T
  ): Promise<NextResponse> {
    try {
      let transformedData: unknown = data;
      if (this.resource) {
        const resource = new this.resource();
        if (Array.isArray(data) && typeof resource.collection === "function") {
          transformedData = await resource.collection(data as TEntity[]);
        } else if (typeof resource.toArray === "function") {
          transformedData = await resource.toArray(data as TEntity);
        }
      }

      return NextResponse.json({ code: status, message, data: transformedData }, { status });
    } catch (error) {
      return this.sendError((error as Error).message, {}, 500);
    }
  }

  protected getRouteParam(name?: string): string | null {
    if (!this.__request?.url) return null;
    const url = new URL(this.__request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    if (!name) return segments.pop() ?? null;
    return segments.pop() ?? null;
  }

  protected getCurrentUser<T = any>(): T | null {
    if (this.user) return this.user as T;
    this.user = this.safeParseUser();
    return this.user as T;
  }

  protected requireUser<T = any>(): T {
    const user = this.getCurrentUser<T>();
    if (!user) throw new Error("Unauthorized: No user in request context");
    return user;
  }
}
