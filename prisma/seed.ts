import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { OrganizationRole, OrganizationType, PlatformRole } from "../src/generated/prisma/enums";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to seed the database.");

const db = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });
const passwordHash = await bcrypt.hash("TemuClient123!", 12);

async function upsertWorkspace(input: { email: string; name: string; organizationName: string; slug: string; type: OrganizationType }) {
  const user = await db.user.upsert({
    where: { email: input.email },
    update: { name: input.name, status: "ACTIVE", credential: { upsert: { create: { passwordHash }, update: { passwordHash } } } },
    create: { name: input.name, email: input.email, emailVerifiedAt: new Date(), credential: { create: { passwordHash } } },
  });
  const organization = await db.organization.upsert({
    where: { slug: input.slug },
    update: { name: input.organizationName, type: input.type },
    create: { name: input.organizationName, slug: input.slug, type: input.type, city: "Jakarta", description: "Workspace demonstrasi terverifikasi untuk pengembangan TemuClient." },
  });
  await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
    update: { role: OrganizationRole.OWNER, status: "ACTIVE" },
    create: { organizationId: organization.id, userId: user.id, role: OrganizationRole.OWNER },
  });
  return { user, organization };
}

const serviceNames = ["Custom Software Development", "Web Development", "Mobile Development", "ERP", "CRM", "AI Development", "Data & Analytics", "Cloud", "DevOps", "Cybersecurity", "IT Outsourcing", "UI/UX", "System Integration", "Digital Transformation", "SaaS Implementation"];
const industryNames = ["Technology", "Retail", "FMCG", "Manufacturing", "Logistics", "Finance", "Healthcare", "Education", "Hospitality", "Construction", "Property", "Automotive", "Government", "Professional Services", "Other"];
const technologyNames = [{ name: "TypeScript", category: "Language" }, { name: "React", category: "Frontend" }, { name: "Next.js", category: "Framework" }, { name: "Node.js", category: "Backend" }, { name: "PostgreSQL", category: "Database" }, { name: "AWS", category: "Cloud" }, { name: "Docker", category: "DevOps" }, { name: "Kubernetes", category: "DevOps" }, { name: "Python", category: "Language" }, { name: "Odoo", category: "ERP" }];
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function seedTaxonomies() {
  for (const [sortOrder, name] of serviceNames.entries()) await db.serviceCategory.upsert({ where: { slug: slugify(name) }, update: { name, sortOrder, isActive: true }, create: { name, slug: slugify(name), sortOrder } });
  for (const [sortOrder, name] of industryNames.entries()) await db.industry.upsert({ where: { slug: slugify(name) }, update: { name, sortOrder, isActive: true }, create: { name, slug: slugify(name), sortOrder } });
  for (const item of technologyNames) await db.technology.upsert({ where: { slug: slugify(item.name) }, update: item, create: { ...item, slug: slugify(item.name) } });
}

const providerSeeds = [
  { name: "Sagara Software", slug: "sagara-software", city: "Jakarta", size: 48, capacity: 12, service: "Custom Software Development", industry: "Logistics", project: "Warehouse Operations Platform", client: "PT Rantai Distribusi", confidential: true, technology: "TypeScript" },
  { name: "Nusa Systems", slug: "nusa-systems", city: "Surabaya", size: 72, capacity: 18, service: "System Integration", industry: "Manufacturing", project: "Factory Integration Hub", client: "Nusa Manufacturing", confidential: false, technology: "Node.js" },
  { name: "Orbit Teknologi", slug: "orbit-teknologi", city: "Bandung", size: 30, capacity: 7, service: "Mobile Development", industry: "Retail", project: "Omnichannel Retail App", client: "Retail Nusantara", confidential: false, technology: "React" },
  { name: "Tera Digital Labs", slug: "tera-digital-labs", city: "Yogyakarta", size: 24, capacity: 5, service: "AI Development", industry: "Finance", project: "Risk Document Intelligence", client: "Regional Finance Group", confidential: true, technology: "Python" },
  { name: "Karya Cloud Indonesia", slug: "karya-cloud-indonesia", city: "Jakarta", size: 40, capacity: 10, service: "Cloud", industry: "Technology", project: "Cloud Modernization Program", client: "Teknologi Karya", confidential: false, technology: "AWS" },
  { name: "Merah Putih Cyber", slug: "merah-putih-cyber", city: "Tangerang", size: 55, capacity: 9, service: "Cybersecurity", industry: "Finance", project: "Security Posture Improvement", client: "National Financial Institution", confidential: true, technology: "Docker" },
  { name: "Awan DevOps Nusantara", slug: "awan-devops-nusantara", city: "Denpasar", size: 18, capacity: 4, service: "DevOps", industry: "Hospitality", project: "Continuous Delivery Transformation", client: "Bali Hospitality Network", confidential: false, technology: "Kubernetes" },
  { name: "Arunika Data Works", slug: "arunika-data-works", city: "Jakarta", size: 36, capacity: 8, service: "Data & Analytics", industry: "FMCG", project: "Distribution Analytics", client: "Consumer Goods Company", confidential: true, technology: "PostgreSQL" },
  { name: "Bentala ERP Consulting", slug: "bentala-erp-consulting", city: "Semarang", size: 28, capacity: 6, service: "ERP", industry: "Construction", project: "Integrated Project ERP", client: "Bentala Konstruksi", confidential: false, technology: "Odoo" },
  { name: "Cakrawala UX Studio", slug: "cakrawala-ux-studio", city: "Bandung", size: 16, capacity: 3, service: "UI/UX", industry: "Healthcare", project: "Patient Experience Redesign", client: "Healthcare Provider", confidential: true, technology: "React" },
];

async function seedProviders() {
  for (const [index, item] of providerSeeds.entries()) {
    const organization = await db.organization.upsert({ where: { slug: item.slug }, update: { name: item.name, type: "PROVIDER", city: item.city, companySize: item.size, teamCapacity: item.capacity, availability: index % 3 === 2 ? "LIMITED" : "AVAILABLE" }, create: { name: item.name, slug: item.slug, type: "PROVIDER", city: item.city, companySize: item.size, teamCapacity: item.capacity, availability: index % 3 === 2 ? "LIMITED" : "AVAILABLE", website: `https://${item.slug}.example`, businessEmail: `hello@${item.slug}.example`, description: `${item.name} adalah provider teknologi B2B fiktif untuk data pengembangan TemuClient.` } });
    const category = await db.serviceCategory.findUniqueOrThrow({ where: { slug: slugify(item.service) } });
    const industry = await db.industry.findUniqueOrThrow({ where: { slug: slugify(item.industry) } });
    const technology = await db.technology.findUniqueOrThrow({ where: { slug: slugify(item.technology) } });
    await db.organizationService.upsert({ where: { organizationId_serviceCategoryId: { organizationId: organization.id, serviceCategoryId: category.id } }, update: { isPrimary: true, minProjectValue: BigInt(50_000_000 + index * 25_000_000), maxProjectValue: BigInt(400_000_000 + index * 100_000_000), typicalDurationMin: 2 + index % 3, typicalDurationMax: 6 + index % 5 }, create: { organizationId: organization.id, serviceCategoryId: category.id, description: `${item.service} untuk perusahaan menengah dan enterprise.`, isPrimary: true, minProjectValue: BigInt(50_000_000 + index * 25_000_000), maxProjectValue: BigInt(400_000_000 + index * 100_000_000), typicalDurationMin: 2 + index % 3, typicalDurationMax: 6 + index % 5 } });
    if (index === 1 || index === 2) {
      const customSoftware = await db.serviceCategory.findUniqueOrThrow({ where: { slug: "custom-software-development" } });
      await db.organizationService.upsert({ where: { organizationId_serviceCategoryId: { organizationId: organization.id, serviceCategoryId: customSoftware.id } }, update: { isPrimary: false, minProjectValue: BigInt(100_000_000), maxProjectValue: BigInt(500_000_000) }, create: { organizationId: organization.id, serviceCategoryId: customSoftware.id, description: "Pengembangan perangkat lunak khusus sebagai kapabilitas pendukung.", isPrimary: false, minProjectValue: BigInt(100_000_000), maxProjectValue: BigInt(500_000_000), typicalDurationMin: 3, typicalDurationMax: 9 } });
    }
    await db.organizationIndustry.upsert({ where: { organizationId_industryId: { organizationId: organization.id, industryId: industry.id } }, update: { experienceLevel: index % 2 ? "ADVANCED" : "EXPERT" }, create: { organizationId: organization.id, industryId: industry.id, experienceLevel: index % 2 ? "ADVANCED" : "EXPERT" } });
    const portfolio = await db.portfolio.upsert({ where: { organizationId_slug: { organizationId: organization.id, slug: slugify(item.project) } }, update: { title: item.project, clientName: item.client, isClientConfidential: item.confidential, industryId: industry.id }, create: { organizationId: organization.id, title: item.project, slug: slugify(item.project), clientName: item.client, isClientConfidential: item.confidential, industryId: industry.id, problem: "Proses bisnis terfragmentasi dan sulit dipantau secara konsisten oleh tim operasional.", solution: "Merancang dan menerapkan solusi digital terintegrasi dengan delivery bertahap dan pengukuran yang jelas.", outcome: "Waktu proses berkurang dan visibilitas operasional meningkat.", projectValueMin: BigInt(75_000_000 + index * 25_000_000), projectValueMax: BigInt(350_000_000 + index * 75_000_000), durationMonths: 4 + index % 5, status: "PUBLISHED" } });
    await db.portfolioTechnology.upsert({ where: { portfolioId_technologyId: { portfolioId: portfolio.id, technologyId: technology.id } }, update: {}, create: { portfolioId: portfolio.id, technologyId: technology.id } });
  }
}

async function seedBuyerRequirement(buyerOrganizationId: string, buyerUserId: string) {
  const service = await db.serviceCategory.findUniqueOrThrow({ where: { slug: "custom-software-development" } });
  const industry = await db.industry.findUniqueOrThrow({ where: { slug: "logistics" } });
  const opportunity = await db.opportunity.upsert({
    where: { buyerOrganizationId_slug: { buyerOrganizationId, slug: "warehouse-management-system" } },
    update: { title: "Warehouse Management System", serviceCategoryId: service.id, industryId: industry.id, status: "ACTIVE" },
    create: { buyerOrganizationId, title: "Warehouse Management System", slug: "warehouse-management-system", serviceCategoryId: service.id, industryId: industry.id, problemStatement: "Operasional inventory pada lima warehouse belum terintegrasi sehingga akurasi stok dan proses replenishment sulit dipantau.", businessObjective: "Meningkatkan akurasi inventory dan visibilitas operasional lintas warehouse.", description: "Membangun sistem warehouse terintegrasi untuk inventory, transfer, replenishment, dan operational reporting.", projectType: "NEW_DEVELOPMENT", budgetMin: BigInt(250_000_000), budgetMax: BigInt(400_000_000), budgetStatus: "APPROVED", timelineStart: new Date("2026-09-01T00:00:00.000Z"), timelineEnd: new Date("2027-02-28T00:00:00.000Z"), country: "Indonesia", province: "Jawa Timur", city: "Surabaya", remoteAllowed: true, decisionMakerInvolved: true, intentScore: 92, intentLevel: "VERY_HIGH", intentAlgorithmVersion: "buyer-intent-v1", intentCalculatedAt: new Date(), verificationLevel: 0, status: "ACTIVE", publishedAt: new Date(), expiresAt: new Date("2026-12-31T00:00:00.000Z"), createdById: buyerUserId },
  });
  await db.opportunityRequirement.deleteMany({ where: { opportunityId: opportunity.id } });
  await db.opportunityRequirement.createMany({ data: [
    { opportunityId: opportunity.id, category: "FUNCTIONAL", label: "Multi-warehouse inventory", description: "Kelola stok dan perpindahan inventory untuk lima lokasi warehouse.", priority: "MUST_HAVE", sortOrder: 0 },
    { opportunityId: opportunity.id, category: "INTEGRATION", label: "ERP integration", description: "Integrasi dua arah dengan ERP perusahaan yang sudah berjalan.", priority: "MUST_HAVE", sortOrder: 1 },
  ] });
  return opportunity;
}

async function main() {
  await db.user.upsert({
    where: { email: "admin@temuclient.local" },
    update: { name: "TemuClient Admin", platformRole: PlatformRole.SUPER_ADMIN, credential: { upsert: { create: { passwordHash }, update: { passwordHash } } } },
    create: { name: "TemuClient Admin", email: "admin@temuclient.local", emailVerifiedAt: new Date(), platformRole: PlatformRole.SUPER_ADMIN, credential: { create: { passwordHash } } },
  });
  await upsertWorkspace({ email: "provider@temuclient.local", name: "Arif Rahman", organizationName: "Sagara Software", slug: "sagara-software", type: OrganizationType.PROVIDER });
  const buyer = await upsertWorkspace({ email: "buyer@temuclient.local", name: "Nadia Putri", organizationName: "PT Nusantara Logistik", slug: "pt-nusantara-logistik", type: OrganizationType.BUYER });
  await seedTaxonomies();
  await seedProviders();
  const opportunity = await seedBuyerRequirement(buyer.organization.id, buyer.user.id);
  const { generateMatchesForOpportunity } = await import("../src/modules/matching/service");
  await generateMatchesForOpportunity(opportunity.id);
}

await main().finally(() => db.$disconnect());
