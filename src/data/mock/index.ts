import type {
  BuyerRequirementViewModel,
  DealCardViewModel,
  OpportunityCardViewModel,
  ProviderMatchViewModel,
} from "./types";

const opportunitySeeds = [
  ["warehouse-management", "Warehouse Management System", "Manufacturing", "Surabaya", "Rp250–400 jt", "4–6 bulan"],
  ["sales-force", "Sales Force Automation", "Distribution", "Jakarta", "Rp120–220 jt", "3–4 bulan"],
  ["erp-manufacturing", "ERP Manufacturing", "Manufacturing", "Bekasi", "Rp700 jt–1,2 M", "8–12 bulan"],
  ["retail-pos", "Retail POS Modernization", "Retail", "Bandung", "Rp300–500 jt", "5–7 bulan"],
  ["distributor-app", "Distributor Mobile App", "FMCG", "Semarang", "Rp180–320 jt", "4–5 bulan"],
  ["hr-self-service", "HR Self Service Platform", "Services", "Jakarta", "Rp90–160 jt", "3 bulan"],
  ["security-assessment", "Cybersecurity Assessment", "Financial Services", "Jakarta", "Rp75–125 jt", "6–8 minggu"],
  ["cloud-migration", "Cloud Migration", "Logistics", "Surabaya", "Rp350–650 jt", "5–8 bulan"],
  ["customer-portal", "B2B Customer Portal", "Distribution", "Tangerang", "Rp200–350 jt", "4–6 bulan"],
  ["ai-support", "AI Customer Support", "Retail", "Jakarta", "Rp150–300 jt", "3–5 bulan"],
  ["fleet-tracking", "Fleet Tracking Platform", "Logistics", "Medan", "Rp280–450 jt", "5 bulan"],
  ["procurement", "Procurement Workflow", "Construction", "Makassar", "Rp100–180 jt", "3–4 bulan"],
  ["data-warehouse", "Enterprise Data Warehouse", "Financial Services", "Jakarta", "Rp800 jt–1,5 M", "9–12 bulan"],
  ["clinic-system", "Clinic Operations System", "Healthcare", "Yogyakarta", "Rp140–240 jt", "4–6 bulan"],
  ["dealer-portal", "Automotive Dealer Portal", "Automotive", "Karawang", "Rp320–550 jt", "6–8 bulan"],
  ["quality-control", "Digital Quality Control", "Manufacturing", "Cikarang", "Rp210–380 jt", "4–6 bulan"],
  ["loyalty", "Customer Loyalty Platform", "Hospitality", "Bali", "Rp125–250 jt", "3–5 bulan"],
  ["network-audit", "Infrastructure & Network Audit", "Education", "Bandung", "Rp25–60 jt", "4–6 minggu"],
  ["order-management", "Omnichannel Order Management", "Retail", "Jakarta", "Rp500–850 jt", "7–10 bulan"],
  ["planning", "Demand Planning Analytics", "FMCG", "Bogor", "Rp200–420 jt", "5–7 bulan"],
] as const;

export const opportunities: OpportunityCardViewModel[] = opportunitySeeds.map((seed, index) => ({
  id: seed[0],
  title: seed[1],
  industry: seed[2],
  city: seed[3],
  budget: seed[4],
  timeline: seed[5],
  category: index % 3 === 0 ? "SOFTWARE DEVELOPMENT" : index % 3 === 1 ? "DIGITAL TRANSFORMATION" : "IT CONSULTING",
  summary: `Perusahaan ${seed[2].toLowerCase()} mencari partner terverifikasi untuk merancang dan mengimplementasikan ${seed[1].toLowerCase()} pada operasi utama mereka.`,
  intent: 92 - (index % 7) * 4,
  match: 94 - (index % 8) * 3,
  verified: index % 4 === 0 ? 5 : 4,
  interested: 2 + (index % 5),
  published: index < 3 ? `${index + 2}j lalu` : `${(index % 6) + 1}h lalu`,
}));

export const providers: ProviderMatchViewModel[] = [
  { id: "sagara", name: "Sagara Software", initials: "SS", city: "Surabaya", services: ["Custom Software", "System Integration"], match: 94, verified: true, experience: "12 proyek logistics", projectSize: "Rp150–750 jt", responseTime: "± 2 jam", rating: 4.9 },
  { id: "nusa", name: "Nusa Systems", initials: "NS", city: "Jakarta", services: ["ERP", "Cloud Platform"], match: 87, verified: true, experience: "8 proyek manufacturing", projectSize: "Rp250 jt–1,2 M", responseTime: "± 4 jam", rating: 4.8 },
  { id: "tera", name: "Tera Digital Labs", initials: "TD", city: "Bandung", services: ["Product Development", "Data & AI"], match: 82, verified: true, experience: "6 proyek distribution", projectSize: "Rp100–600 jt", responseTime: "± 3 jam", rating: 4.7 },
  { id: "orbit", name: "Orbit Teknologi", initials: "OT", city: "Yogyakarta", services: ["Mobile Apps", "UX Research"], match: 76, verified: true, experience: "5 proyek retail", projectSize: "Rp75–350 jt", responseTime: "± 6 jam", rating: 4.6 },
  { id: "karya-cloud", name: "Karya Cloud Indonesia", initials: "KC", city: "Jakarta", services: ["Cloud Migration", "Cybersecurity"], match: 72, verified: true, experience: "9 proyek enterprise", projectSize: "Rp200 jt–1,5 M", responseTime: "± 5 jam", rating: 4.8 },
];

export const deals: DealCardViewModel[] = [
  { id: "nusantara", company: "PT Nusantara Logistik", opportunity: "Warehouse Management System", stage: "INTRODUCTION", value: "Rp350 jt", probability: 25, lastActivity: "Hari ini", nextAction: "Konfirmasi discovery" },
  { id: "sentra", company: "PT Sentra Manufaktur", opportunity: "ERP Manufacturing", stage: "DISCOVERY", value: "Rp850 jt", probability: 45, lastActivity: "Kemarin", nextAction: "Kirim solution brief" },
  { id: "sumber", company: "PT Sumber Retail Indonesia", opportunity: "Retail POS Modernization", stage: "PROPOSAL", value: "Rp480 jt", probability: 65, lastActivity: "4 hari lalu", nextAction: "Follow up proposal" },
  { id: "arunika", company: "PT Arunika Distribusi", opportunity: "Distributor Mobile App", stage: "NEGOTIATION", value: "Rp290 jt", probability: 80, lastActivity: "2 hari lalu", nextAction: "Review komersial" },
  { id: "cipta", company: "PT Cipta Pangan Nusantara", opportunity: "Demand Planning Analytics", stage: "DISCOVERY", value: "Rp375 jt", probability: 40, lastActivity: "3 hari lalu", nextAction: "Libatkan operations" },
];

export const requirements: BuyerRequirementViewModel[] = [
  { id: "warehouse-management", title: "Warehouse Management System", status: "MATCHING", matches: 12, shortlisted: 3, introductions: 2, updated: "12 menit lalu" },
  { id: "cloud-migration", title: "Cloud Migration", status: "ACTIVE", matches: 8, shortlisted: 2, introductions: 1, updated: "Kemarin" },
  { id: "security-assessment", title: "Cybersecurity Assessment", status: "DRAFT", matches: 0, shortlisted: 0, introductions: 0, updated: "3 hari lalu" },
];

export const conversations = [
  { id: "sagara", company: "Sagara Software", preview: "Kami sudah review integrasi ERP…", time: "10:24", unread: 2 },
  { id: "nusa", company: "Nusa Systems", preview: "Jadwal discovery sudah kami terima.", time: "Kemarin", unread: 0 },
  { id: "tera", company: "Tera Digital Labs", preview: "Berikut pendekatan fase pertama…", time: "Sen", unread: 0 },
];

export const meetings = [
  { id: "discovery", title: "Discovery — Warehouse Management", company: "PT Nusantara Logistik", date: "Selasa, 11 Agustus", time: "10.00–11.00 WIB", status: "Besok" },
  { id: "solution-review", title: "Solution Review — ERP", company: "PT Sentra Manufaktur", date: "Kamis, 13 Agustus", time: "14.00–15.00 WIB", status: "Minggu ini" },
  { id: "commercial", title: "Commercial Discussion", company: "PT Arunika Distribusi", date: "Senin, 17 Agustus", time: "09.30–10.30 WIB", status: "Mendatang" },
];

export const moderationRows = [
  { company: "PT Nusantara Logistik", type: "Buyer", status: "Pending", risk: "Low", submitted: "10 Agu 2026" },
  { company: "Sagara Software", type: "Provider", status: "Verified", risk: "Low", submitted: "9 Agu 2026" },
  { company: "PT Sentra Manufaktur", type: "Buyer", status: "Review", risk: "Medium", submitted: "9 Agu 2026" },
  { company: "Orbit Teknologi", type: "Provider", status: "Pending", risk: "Low", submitted: "8 Agu 2026" },
];
