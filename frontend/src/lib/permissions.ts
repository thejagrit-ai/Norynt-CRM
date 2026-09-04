// src/lib/permissions.ts — Centralized RBAC Permission Catalog.
// Synchronized with backend/src/common/constants/permission.enum.ts.

export const PERMISSION_GROUPS: { group: string; perms: string[] }[] = [
  // ── Sales & CRM ──
  { group: 'Deals', perms: ['deal.create', 'deal.read', 'deal.update', 'deal.delete', 'deal.move'] },
  { group: 'Leads', perms: ['lead.create', 'lead.read', 'lead.update', 'lead.delete', 'lead.convert'] },
  { group: 'Lead Groups', perms: ['lead_group.create', 'lead_group.read', 'lead_group.update', 'lead_group.delete'] },
  { group: 'Contacts', perms: ['contact.create', 'contact.read', 'contact.update', 'contact.delete'] },
  { group: 'Segments', perms: ['segment.create', 'segment.read', 'segment.update', 'segment.delete'] },
  { group: 'Pipeline & Stages', perms: ['pipeline.read', 'pipeline.manage'] },
  { group: 'Companies', perms: ['company.create', 'company.read', 'company.update', 'company.delete'] },
  { group: 'Customer 360', perms: ['customer_360.read'] },

  // ── Marketing & Campaigns ──
  { group: 'Campaigns (Email & SMS)', perms: ['campaign.create', 'campaign.read', 'campaign.update', 'campaign.delete', 'campaign.send'] },
  { group: 'Templates', perms: ['template.create', 'template.read', 'template.update', 'template.delete'] },
  { group: 'Funnels', perms: ['funnel.create', 'funnel.read', 'funnel.update', 'funnel.delete'] },
  { group: 'Automated Rules', perms: ['automation.read', 'automation.manage'] },

  // ── Messaging & WhatsApp ──
  { group: 'WhatsApp Suite', perms: ['whatsapp.read', 'whatsapp.send'] },

  // ── Support & Tasks ──
  { group: 'Tickets', perms: ['ticket.create', 'ticket.read', 'ticket.update', 'ticket.delete'] },
  { group: 'Tasks & Activities', perms: ['task.create', 'task.read', 'task.update', 'task.delete'] },
  { group: 'Meetings & Calendar', perms: ['meeting.create', 'meeting.read', 'meeting.update', 'meeting.delete'] },
  { group: 'Help & Support Portal', perms: ['support.read', 'support.manage'] },

  // ── Finance, CPQ & Billing ──
  { group: 'Products & Catalog', perms: ['product.create', 'product.read', 'product.update', 'product.delete'] },
  { group: 'Masters (Tax & UOM)', perms: ['master.create', 'master.read', 'master.update', 'master.delete'] },
  { group: 'Quotes', perms: ['quote.create', 'quote.read', 'quote.update', 'quote.delete', 'quote.send', 'quote.convert'] },
  { group: 'Invoices & Ledger', perms: ['invoice.create', 'invoice.read', 'invoice.update', 'invoice.delete', 'invoice.read_financial'] },
  { group: 'Approvals', perms: ['approval.read', 'approval.manage'] },

  // ── Insights & Intelligence ──
  { group: 'AI Copilot & Agents', perms: ['ai.use'] },
  { group: 'Custom Reports', perms: ['custom_report.create', 'custom_report.read', 'custom_report.update', 'custom_report.delete', 'custom_report.execute'] },
  { group: 'Competitor Intelligence', perms: ['brand.read', 'brand.manage'] },

  // ── Resources & Configurations ──
  { group: 'Media Library', perms: ['media.create', 'media.read', 'media.update', 'media.delete'] },
  { group: 'Website Lead Forms', perms: ['lead_form.read', 'lead_form.manage'] },
  { group: 'Custom Field Schemas', perms: ['custom_field.read', 'custom_field.manage'] },
  { group: 'App Connections & Webhooks', perms: ['integration.read', 'integration.manage'] },
  { group: 'Logo & Branding', perms: ['branding.manage'] },

  // ── Administration & Security ──
  { group: 'Team Members', perms: ['user.create', 'user.read', 'user.update', 'user.delete'] },
  { group: 'Roles & Permissions', perms: ['role.create', 'role.read', 'role.update', 'role.delete', 'role.assign'] },
  { group: 'Workspaces & Tenants', perms: ['platform.tenant.manage'] },
  { group: 'Data Management', perms: ['data.export', 'data.import', 'data.merge'] },
  { group: 'Audit & Compliance', perms: ['audit.read', 'gdpr.export', 'gdpr.erase'] },
];

export const ALL_UI_PERMISSIONS: string[] = PERMISSION_GROUPS.flatMap((g) => g.perms);
