// Seeds menus, roles, and role→menu permissions.
// Idempotent — safe to run repeatedly (uses upsert / unique keys).
//
// Run with:  npx prisma db seed
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// menuGroup:
//   "public" — always visible (before AND after login), never role-gated.
//   "app"    — shown only after login, gated by role→menu permissions.
const MENUS = [
  { name: "Home",           slug: "home",      url: "/",          order: 1, menuGroup: "public", icon: "fa fa-home" },
  { name: "Blog",           slug: "blog",      url: "/blog",      order: 2, menuGroup: "public", icon: "fa fa-newspaper" },
  { name: "Pricing",        slug: "pricing",   url: "/pricing",   order: 3, menuGroup: "public", icon: "fa fa-tag" },
  { name: "Help & Support", slug: "help",      url: "/help",      order: 4, menuGroup: "public", icon: "fa fa-life-ring" },
  { name: "Dashboard",      slug: "dashboard", url: "/dashboard", order: 5, menuGroup: "app",    icon: "fa fa-gauge" },
  { name: "Listings",       slug: "listings",  url: "/listings",  order: 6, menuGroup: "app",    icon: "fa fa-list" },
  { name: "Plans",          slug: "plans",     url: "/plans",     order: 7, menuGroup: "app",    icon: "fa fa-tags" },
  { name: "Roles",          slug: "roles",     url: "/roles",     order: 8, menuGroup: "app",    icon: "fa fa-user-shield" },
  { name: "Menus",          slug: "menus",     url: "/menus",     order: 9, menuGroup: "app",    icon: "fa fa-bars" },
];

const ROLES = [
  { name: "Developer", slug: "developer", description: "Full access to every menu, including role & menu administration." },
  { name: "Admin",     slug: "admin",     description: "Access to all menus except role & menu administration." },
  { name: "Client",    slug: "client",    description: "Access to Dashboard and Listings." },
];

// Menus each role may access AFTER login. Public menus are always shown and are
// intentionally omitted here. Developer is handled generically (gets all "app"
// menus). Admin gets every app menu except the admin-only ones. Client gets an
// explicit list.
const ADMIN_ONLY_SLUGS = ["roles", "menus"]; // dev-only admin pages — hidden from Admin
const CLIENT_MENU_SLUGS = ["dashboard", "listings"];

// Initial pricing plans — seeded only when the plans table is empty so admin
// edits made via /plans are never clobbered on re-seed.
const PLANS = [
  {
    name: "Free",
    priceMonthly: "$1",
    priceYearly: "$10",
    highlight: false,
    blurb: "Everything you need to try it out.",
    cta: "Get started free",
    href: "/signup",
    features: [
      "Connect your account with one secure key",
      "Post on Fb marketplace in 1-click",
      "Upload 10 property pictures",
      "Upload 20 property listings on fb Marketplace",
    ],
  },
  {
    name: "Pro",
    priceMonthly: "$9.99",
    priceYearly: "$99",
    highlight: true,
    blurb: "publish unlimited listings on fb Marketplace.",
    cta: "Upgrade to Pro",
    href: "/signup",
    features: [
      "Connect your account with one secure key",
      "Post on Fb marketplace in 1-click",
      "Upload 20 property pictures",
      "unlimited property listings on fb Marketplace",
      "Priority support",
    ],
  },
];

async function main() {
  // --- Menus -------------------------------------------------------------
  for (const m of MENUS) {
    await prisma.menu.upsert({
      where: { slug: m.slug },
      update: { name: m.name, url: m.url, order: m.order, menuGroup: m.menuGroup, icon: m.icon, status: 1, newWindow: 0 },
      create: { ...m, status: 1, newWindow: 0 },
    });
  }

  // --- Roles -------------------------------------------------------------
  for (const r of ROLES) {
    await prisma.role.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.description, status: 1 },
      create: { ...r, status: 1 },
    });
  }

  // --- Role → Menu -------------------------------------------------------
  const appMenus = await prisma.menu.findMany({ where: { menuGroup: "app" } });

  const assignments = {
    developer: appMenus.map((m) => m.slug),                                  // all app menus
    admin: appMenus.filter((m) => !ADMIN_ONLY_SLUGS.includes(m.slug)).map((m) => m.slug),
    client: CLIENT_MENU_SLUGS,
  };

  const menuBySlug = Object.fromEntries(appMenus.map((m) => [m.slug, m]));

  for (const [roleSlug, slugs] of Object.entries(assignments)) {
    // Replace this role's assignments so re-seeding stays in sync.
    await prisma.roleMenu.deleteMany({ where: { roleSlug } });
    for (const slug of slugs) {
      const menu = menuBySlug[slug];
      if (!menu) continue; // slug not present yet (e.g. future admin pages)
      await prisma.roleMenu.create({ data: { roleSlug, menuId: menu.id } });
    }
  }

  // --- Plans -------------------------------------------------------------
  // Seed only when empty so admin edits via /plans survive re-seeding.
  const planCount = await prisma.plan.count();
  if (planCount === 0) {
    for (const p of PLANS) {
      const { features, ...fields } = p;
      await prisma.plan.create({
        data: {
          ...fields,
          features: { create: features.map((name, i) => ({ name, order: i + 1 })) },
        },
      });
    }
    console.log(`Seeded ${PLANS.length} plans.`);
  } else {
    console.log(`Plans table already has ${planCount} rows — skipped plan seeding.`);
  }

  console.log("Seed complete: menus, roles, role→menu permissions, and plans.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
