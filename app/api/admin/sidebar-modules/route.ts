import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/utils/jwt";

export const runtime = "nodejs";

type SidebarNavItemDto = {
  name: string;
  path?: string;
  icon: string | null;
  subItems?: { name: string; path: string }[];
};

function buildSidebarItems(
  modules: {
    id: number;
    name: string;
    routeName: string | null;
    icon: string | null;
    parentId: number | null;
    sortOrder: number | null;
    status: boolean;
    deletedAt: Date | null;
  }[]
): SidebarNavItemDto[] {
  const active = modules.filter((m) => m.deletedAt == null && m.status);
  const childrenByParent = new Map<number, typeof active>();
  for (const m of active) {
    if (m.parentId != null) {
      const list = childrenByParent.get(m.parentId) ?? [];
      list.push(m);
      childrenByParent.set(m.parentId, list);
    }
  }
  for (const [, arr] of childrenByParent) {
    arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
  const roots = active
    .filter((m) => m.parentId == null)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const out: SidebarNavItemDto[] = [];
  for (const r of roots) {
    const kids = childrenByParent.get(r.id) ?? [];
    if (kids.length > 0) {
      out.push({
        name: r.name,
        icon: r.icon,
        subItems: kids.map((k) => ({
          name: k.name,
          path: k.routeName ?? "#",
        })),
      });
    } else if (r.routeName && r.routeName !== "#") {
      out.push({
        name: r.name,
        path: r.routeName,
        icon: r.icon,
      });
    }
  }
  return out;
}

async function getUserIdFromRequest(req: Request): Promise<number | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  const decoded = await verifyToken(token);
  if (!decoded || typeof decoded === "string") return null;
  const raw = (decoded as { id?: unknown }).id;
  if (raw === undefined || raw === null) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { code: 401, message: "Unauthorized", data: { items: [] } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userGroupId: true },
    });

    if (!user?.userGroupId) {
      return NextResponse.json({
        code: 200,
        message: "ok",
        data: {
          items: [
            {
              name: "Dashboard",
              path: "/admin",
              icon: "LayoutDashboard",
            },
          ] satisfies SidebarNavItemDto[],
        },
      });
    }

    const permissions = await prisma.cmsModulePermission.findMany({
      where: {
        userRoleId: user.userGroupId,
        isView: true,
        deletedAt: null,
      },
      include: {
        cmsModule: true,
      },
    });

    const modules = permissions
      .map((p) => p.cmsModule)
      .filter((m): m is NonNullable<typeof m> => m != null);

    const items = buildSidebarItems(modules);

    return NextResponse.json({
      code: 200,
      message: "ok",
      data: { items },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json(
      { code: 500, message, data: { items: [] } },
      { status: 500 }
    );
  }
}
