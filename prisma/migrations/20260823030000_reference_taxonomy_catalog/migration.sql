-- Production-safe reference data. This migration intentionally contains no
-- users, organizations, opportunities, or other demo/commercial records.
INSERT INTO "ServiceCategory" ("id", "name", "slug", "description", "isActive", "sortOrder", "updatedAt") VALUES
  ('svc_custom_software', 'Custom Software Development', 'custom-software-development', 'Pengembangan aplikasi bisnis khusus sesuai proses dan kebutuhan perusahaan.', true, 10, CURRENT_TIMESTAMP),
  ('svc_web_development', 'Web Development', 'web-development', 'Pengembangan website, portal, dashboard, dan aplikasi web.', true, 20, CURRENT_TIMESTAMP),
  ('svc_mobile_development', 'Mobile Development', 'mobile-development', 'Pengembangan aplikasi Android, iOS, atau lintas platform.', true, 30, CURRENT_TIMESTAMP),
  ('svc_erp', 'ERP', 'erp', 'Konsultasi, implementasi, kustomisasi, dan integrasi sistem ERP.', true, 40, CURRENT_TIMESTAMP),
  ('svc_crm', 'CRM', 'crm', 'Implementasi dan kustomisasi CRM untuk proses sales dan layanan pelanggan.', true, 50, CURRENT_TIMESTAMP),
  ('svc_ai_development', 'AI Development', 'ai-development', 'Pengembangan solusi AI, machine learning, automasi, dan intelligent assistant.', true, 60, CURRENT_TIMESTAMP),
  ('svc_data_analytics', 'Data & Analytics', 'data-analytics', 'Data engineering, business intelligence, dashboard, dan analitik bisnis.', true, 70, CURRENT_TIMESTAMP),
  ('svc_cloud', 'Cloud', 'cloud', 'Konsultasi cloud, migrasi, modernisasi, dan pengelolaan infrastruktur.', true, 80, CURRENT_TIMESTAMP),
  ('svc_devops', 'DevOps', 'devops', 'CI/CD, platform engineering, infrastructure as code, dan observability.', true, 90, CURRENT_TIMESTAMP),
  ('svc_cybersecurity', 'Cybersecurity', 'cybersecurity', 'Audit keamanan, penetration testing, compliance, dan penguatan sistem.', true, 100, CURRENT_TIMESTAMP),
  ('svc_it_outsourcing', 'IT Outsourcing', 'it-outsourcing', 'Penyediaan tim teknologi, managed service, dan dukungan operasional IT.', true, 110, CURRENT_TIMESTAMP),
  ('svc_ui_ux', 'UI/UX', 'ui-ux', 'Riset pengguna, product design, UI design, UX audit, dan design system.', true, 120, CURRENT_TIMESTAMP),
  ('svc_system_integration', 'System Integration', 'system-integration', 'Integrasi aplikasi, API, middleware, data, dan sistem enterprise.', true, 130, CURRENT_TIMESTAMP),
  ('svc_digital_transformation', 'Digital Transformation', 'digital-transformation', 'Konsultasi dan pelaksanaan transformasi proses bisnis berbasis teknologi.', true, 140, CURRENT_TIMESTAMP),
  ('svc_saas_implementation', 'SaaS Implementation', 'saas-implementation', 'Pemilihan, konfigurasi, migrasi, dan adopsi produk SaaS perusahaan.', true, 150, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "isActive" = EXCLUDED."isActive",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Industry" ("id", "name", "slug", "isActive", "sortOrder", "updatedAt") VALUES
  ('ind_technology', 'Technology', 'technology', true, 10, CURRENT_TIMESTAMP),
  ('ind_retail', 'Retail', 'retail', true, 20, CURRENT_TIMESTAMP),
  ('ind_fmcg', 'FMCG', 'fmcg', true, 30, CURRENT_TIMESTAMP),
  ('ind_manufacturing', 'Manufacturing', 'manufacturing', true, 40, CURRENT_TIMESTAMP),
  ('ind_logistics', 'Logistics', 'logistics', true, 50, CURRENT_TIMESTAMP),
  ('ind_finance', 'Finance', 'finance', true, 60, CURRENT_TIMESTAMP),
  ('ind_healthcare', 'Healthcare', 'healthcare', true, 70, CURRENT_TIMESTAMP),
  ('ind_education', 'Education', 'education', true, 80, CURRENT_TIMESTAMP),
  ('ind_hospitality', 'Hospitality', 'hospitality', true, 90, CURRENT_TIMESTAMP),
  ('ind_construction', 'Construction', 'construction', true, 100, CURRENT_TIMESTAMP),
  ('ind_property', 'Property', 'property', true, 110, CURRENT_TIMESTAMP),
  ('ind_automotive', 'Automotive', 'automotive', true, 120, CURRENT_TIMESTAMP),
  ('ind_government', 'Government', 'government', true, 130, CURRENT_TIMESTAMP),
  ('ind_professional_services', 'Professional Services', 'professional-services', true, 140, CURRENT_TIMESTAMP),
  ('ind_other', 'Other', 'other', true, 150, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "isActive" = EXCLUDED."isActive",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Technology" ("id", "name", "slug", "category", "updatedAt") VALUES
  ('tech_typescript', 'TypeScript', 'typescript', 'Language', CURRENT_TIMESTAMP),
  ('tech_javascript', 'JavaScript', 'javascript', 'Language', CURRENT_TIMESTAMP),
  ('tech_python', 'Python', 'python', 'Language', CURRENT_TIMESTAMP),
  ('tech_java', 'Java', 'java', 'Language', CURRENT_TIMESTAMP),
  ('tech_react', 'React', 'react', 'Frontend', CURRENT_TIMESTAMP),
  ('tech_nextjs', 'Next.js', 'next-js', 'Framework', CURRENT_TIMESTAMP),
  ('tech_nodejs', 'Node.js', 'node-js', 'Backend', CURRENT_TIMESTAMP),
  ('tech_postgresql', 'PostgreSQL', 'postgresql', 'Database', CURRENT_TIMESTAMP),
  ('tech_aws', 'AWS', 'aws', 'Cloud', CURRENT_TIMESTAMP),
  ('tech_gcp', 'Google Cloud', 'google-cloud', 'Cloud', CURRENT_TIMESTAMP),
  ('tech_azure', 'Microsoft Azure', 'microsoft-azure', 'Cloud', CURRENT_TIMESTAMP),
  ('tech_docker', 'Docker', 'docker', 'DevOps', CURRENT_TIMESTAMP),
  ('tech_kubernetes', 'Kubernetes', 'kubernetes', 'DevOps', CURRENT_TIMESTAMP),
  ('tech_odoo', 'Odoo', 'odoo', 'ERP', CURRENT_TIMESTAMP),
  ('tech_sap', 'SAP', 'sap', 'ERP', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "category" = EXCLUDED."category",
  "updatedAt" = CURRENT_TIMESTAMP;
