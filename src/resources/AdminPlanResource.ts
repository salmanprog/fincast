import BaseResource from "@/resources/BaseResource";
import type { Plan } from "@prisma/client";

export default class AdminPlanResource extends BaseResource<Plan> {
  async toArray(plan: Plan): Promise<Record<string, unknown>> {
    return {
      id: plan.id,
      slug: plan.slug,
      title: plan.title,
      description: plan.description,
      amount: plan.amount,
      credits: plan.credits,
      status: plan.status,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }
}
