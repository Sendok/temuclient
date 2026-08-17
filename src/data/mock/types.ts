export type OpportunityCardViewModel = {
  id: string;
  category: string;
  title: string;
  industry: string;
  city: string;
  summary: string;
  budget: string;
  timeline: string;
  intent: number;
  match: number;
  verified: number;
  interested: number;
  published: string;
};

export type ProviderMatchViewModel = {
  id: string;
  name: string;
  initials: string;
  city: string;
  services: string[];
  match: number;
  verified: boolean;
  experience: string;
  projectSize: string;
  responseTime: string;
  rating: number;
};

export type DealCardViewModel = {
  id: string;
  company: string;
  opportunity: string;
  stage: "INTRODUCTION" | "DISCOVERY" | "PROPOSAL" | "NEGOTIATION";
  value: string;
  probability: number;
  lastActivity: string;
  nextAction: string;
};

export type BuyerRequirementViewModel = {
  id: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | "MATCHING" | "IN_DISCUSSION";
  matches: number;
  shortlisted: number;
  introductions: number;
  updated: string;
};
