export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  firstName?: string;
  lastName?: string;
  tenantId?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    roles: string[];
    permissions?: string[];
    firstName?: string;
    lastName?: string;
    tenantId?: string | null;
  };
}

export interface Deal {
  id: string;
  title: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  value: string | null;
  currency: string;
  status: 'OPEN' | 'WON' | 'LOST';
  stageId: string;
  pipelineId?: string;
  rank: string;
  healthScore?: number;
  riskFactors?: string[];
  expectedCloseAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardStage {
  id: string;
  name: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
  deals: Deal[];
}

export interface Board {
  pipelineId: string;
  stages: BoardStage[];
}

export interface Invoice {
  id: string;
  number: string | null;
  customerName: string;
  status: string;
  currency: string;
  total?: string;
  amountPaid?: string;
  subtotal?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  completedAt: string | null;
  tags: string[];
  assignedToId: string | null;
  assignedTo: { id: string; firstName: string; lastName: string; email: string } | null;
  lead?: { id: string; firstName: string; lastName: string; companyName: string | null } | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  company?: { id: string; name: string } | null;
  deal?: { id: string; title: string; value: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  number: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  contactId: string | null;
  contact?: { id: string; firstName: string; lastName: string; email: string | null } | null;
  company?: { id: string; name: string } | null;
  deal?: { id: string; title: string } | null;
  assignedTo?: { id: string; firstName: string; lastName: string; email: string } | null;
  messages?: { id: string; senderType: string; body: string; createdAt: string; isInternal: boolean }[];
  _count?: { messages: number };
  createdAt: string;
  updatedAt: string;
}

export interface Customer360Data {
  identity: {
    type: 'COMPANY' | 'CONTACT';
    data: any;
  };
  revenue: {
    totalInvoiced: number;
    totalPaid: number;
    outstanding: number;
    openDealsValue: number;
    dealsCount: number;
    quotesCount: number;
    invoicesCount: number;
  };
  intelligence: {
    healthScore: number;
    recommendation: string;
    lastActivityAt: string | null;
  };
  deals: Deal[];
  invoices: Invoice[];
  quotes: any[];
  tasks: Task[];
  tickets: Ticket[];
  timeline: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    timestamp: string;
    meta?: Record<string, any>;
  }[];
}

export interface Brand {
  id: string;
  name: string;
  sector: string | null;
  niche: string | null;
  description: string | null;
  targetAudience: string | null;
  priceBand: string | null;
  markets: string[];
  keywords: string[];
  answers: {
    knownCompetitors?: string[];
    suggestedCompetitors?: string[];
    adSearchTerms?: string[];
  } | null;
  aiEnriched: boolean;
  createdAt: string;
}

export interface Competitor {
  id: string;
  brandId: string;
  name: string;
  domain: string | null;
  instagram: string | null;
  notes: string | null;
  source: 'manual' | 'ai_suggested';
  createdAt: string;
}

export type LeadChannel = 'MANUAL' | 'IMPORT' | 'FORM' | 'WEBHOOK' | 'API';

export interface UnqualifiedLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  source: string | null;
  channel: LeadChannel;
  formId: string | null;
  status: 'NEW' | 'WORKING' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED';
}

export interface LeadFormField {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  errorMessage?: string;
  defaultCountry?: string;
}

export interface LeadForm {
  id: string;
  name: string;
  publicKey: string;
  secret?: string;
  fields: LeadFormField[];
  buttonColor: string;
  buttonLabel: string;
  successMessage: string | null;
  redirectUrl: string | null;
  isActive: boolean;
  submitCount: number;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  phone: string | null;
  website: string | null;
  contactCount: number;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  roleType?: string | null;
  companyId: string | null;
  company: { id: string; name: string } | null;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}
