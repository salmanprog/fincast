import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Seed-only client shape. Some TS servers resolve `@prisma/client` without newer
 * delegates (`cmModule`, `cmsModulePermission`); this keeps seed typings stable.
 */
type CmModuleRow = { id: number };

type SeedPrismaClient = Pick<
  PrismaClient,
  "user" | "userRole" | "$disconnect"
> & {
  cmModule: {
    findFirst(args: unknown): Promise<CmModuleRow | null>;
    update(args: unknown): Promise<CmModuleRow>;
    create(args: unknown): Promise<CmModuleRow>;
  };
  cmsModulePermission: {
    upsert(args: unknown): Promise<unknown>;
  };
  plan: {
    upsert(args: unknown): Promise<unknown>;
  };
};

const prisma = new PrismaClient() as unknown as SeedPrismaClient;

type FindOrCreateModuleInput = {
  name: string;
  routeName: string;
  icon: string | null;
  sortOrder: number;
  parentId?: number | null;
};

/** Resolve or create a CMS row keyed by route when unique, else name + parent + route "#". */
async function findOrCreateModule(
  opts: FindOrCreateModuleInput
): Promise<CmModuleRow> {
  const parentId = opts.parentId ?? null;
  const existing =
    opts.routeName !== "#"
      ? await prisma.cmModule.findFirst({
          where: { routeName: opts.routeName, deletedAt: null },
        })
      : await prisma.cmModule.findFirst({
          where: {
            name: opts.name,
            parentId,
            routeName: "#",
            deletedAt: null,
          },
        });

  if (existing) {
    return (await prisma.cmModule.update({
      where: { id: existing.id },
      data: {
        name: opts.name,
        routeName: opts.routeName,
        icon: opts.icon,
        sortOrder: opts.sortOrder,
        parentId,
        status: true,
      },
    })) as CmModuleRow;
  }

  return (await prisma.cmModule.create({
    data: {
      name: opts.name,
      routeName: opts.routeName,
      icon: opts.icon,
      sortOrder: opts.sortOrder,
      parentId,
      status: true,
    },
  })) as CmModuleRow;
}

async function main() {
  const adminRole = await prisma.userRole.upsert({
    where: { slug: "admin" },
    update: {},
    create: {
      title: "Administrator",
      slug: "admin",
      description: "Full system access",
      type: "ADMIN",
      isSuperAdmin: true,
      status: true,
    },
  });

  const userRole = await prisma.userRole.upsert({
    where: { slug: "user" },
    update: {},
    create: {
      title: "User",
      slug: "user",
      description: "Regular user access",
      type: "USER",
      isSuperAdmin: false,
      status: true,
    },
  });

  const superAdminRole = adminRole;
  const clientRole = userRole;

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  await prisma.user.upsert({
    where: { email: "admin@fincast.com" },
    update: {},
    create: {
      name: "Super Admin",
      username: "superadmin",
      slug: "super-admin",
      email: "admin@fincast.com",
      password: hashedPassword,
      userGroupId: adminRole.id,
      userType: "ADMIN",
      gender: "MALE",
      profileType: "PUBLIC",
      status: true,
      isEmailVerify: true,
    },
  });

  // Seed pricing plans from current pricing page cards
  const plans = [
    {
      slug: "starter",
      title: "Starter",
      description: "1 forecast · One detailed 30-year report.",
      amount: 1000,
      credits: 1,
      status: true,
    },
    {
      slug: "pro",
      title: "Pro",
      description: "5 forecasts · Compare scenarios side-by-side.",
      amount: 3500,
      credits: 5,
      status: true,
    },
    {
      slug: "enterprise",
      title: "Enterprise",
      description: "Unlimited · For RIAs and family offices.",
      amount: 0,
      credits: 0,
      status: true,
    },
  ] as const;

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        title: plan.title,
        description: plan.description,
        amount: plan.amount,
        credits: plan.credits,
        status: plan.status,
        deletedAt: null,
      },
      create: plan,
    });
  }

  // Create CMS Modules (Menu Items)
  let sortOrder = 1;

  // MAIN SECTION - Dashboard
  const dashboardModule = await findOrCreateModule({
    name: "Dashboard",
    routeName: "/admin",
    icon: "LayoutDashboard",
    sortOrder: sortOrder++,
  });

  // MAIN SECTION - Users (Parent)
  const usersModule = await findOrCreateModule({
    name: "Users",
    routeName: "#",
    icon: "UserCircle",
    sortOrder: sortOrder++,
  });

  // MAIN SECTION - Users (Child)
  const allUsersModule = await findOrCreateModule({
    name: "All Users",
    routeName: "/admin/users/",
    icon: null,
    parentId: usersModule.id,
    sortOrder: 1,
  });

  // MAIN SECTION - Bookings (Parent)
  const bookingsModule = await findOrCreateModule({
    name: "Bookings",
    routeName: "#",
    icon: "Calendar",
    sortOrder: sortOrder++,
  });

  // MAIN SECTION - Bookings (Child)
  const allBookingsModule = await findOrCreateModule({
    name: "All Bookings",
    routeName: "/admin/booking/",
    icon: null,
    parentId: bookingsModule.id,
    sortOrder: 1,
  });

  const planPurchasesModule = await findOrCreateModule({
    name: "Plan purchases",
    routeName: "/admin/user-purchase-plans/",
    icon: "Table",
    sortOrder: sortOrder++,
  });

  // Collect all modules for permission creation
  const superAdminModules = [
    dashboardModule,
    usersModule,
    allUsersModule,
    bookingsModule,
    allBookingsModule,
    planPurchasesModule,
  ];

  const adminModules = [
    dashboardModule,
    usersModule,
    allUsersModule,
    bookingsModule,
    allBookingsModule,
    planPurchasesModule,
  ];

  const clientModules = [
    dashboardModule,
    bookingsModule,
    allBookingsModule,
    planPurchasesModule,
  ];

  const roleModuleMap = [
    {
      role: superAdminRole,
      modules: superAdminModules,
      fullAccess: true,
    },
    {
      role: adminRole,
      modules: adminModules,
      fullAccess: true,
    },
    {
      role: clientRole,
      modules: clientModules,
      fullAccess: false,
    },
  ];

  for (const { role, modules, fullAccess } of roleModuleMap) {
    for (const cmsMod of modules) {
      await prisma.cmsModulePermission.upsert({
        where: {
          userRoleId_cmsModuleId: {
            userRoleId: role.id,
            cmsModuleId: cmsMod.id,
          },
        },
        update: {},
        create: {
          userRoleId: role.id,
          cmsModuleId: cmsMod.id,
          isView: true,
          isAdd: fullAccess,
          isUpdate: fullAccess,
          isDelete: fullAccess,
        },
      });
    }
  }

  console.log("✅ Seed completed successfully");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
