// src/config/navigation.ts — Centralized Navigation Architecture & Role Routing.
import {
  LayoutDashboard,
  Kanban,
  UserCheck,
  FolderKanban,
  Users,
  Sliders,
  GitCommit,
  Mail,
  Smartphone,
  FileCode,
  Flame,
  Layers,
  Zap,
  MessageSquare,
  Radio,
  FileText,
  GitBranch,
  LifeBuoy,
  Settings2,
  CheckSquare,
  Calendar,
  HelpCircle,
  Package,
  Scale,
  Boxes,
  FileCheck,
  FileSpreadsheet,
  Receipt,
  BarChart3,
  LineChart,
  Bot,
  Sparkles,
  FolderOpen,
  Network,
  Plug,
  SlidersHorizontal,
  Settings,
  CreditCard,
  Tag,
  GitPullRequest,
  TrendingUp,
  UserCog,
  ShieldCheck,
  Database,
  ShieldAlert,
  Building2,
  Globe,
  type LucideIcon,
} from 'lucide-react';

export interface NavLeaf {
  href: string;
  labelKey: string;
  defaultLabel: string;
  icon: LucideIcon;
  perms?: string[];
  badge?: 'ai' | 'new';
}

export interface NavGroup {
  id: string;
  titleKey: string;
  defaultTitle: string;
  icon: LucideIcon;
  items: NavLeaf[];
}

export const NAVIGATION_CONFIG: {
  dashboard: NavLeaf;
  groups: NavGroup[];
} = {
  dashboard: {
    href: '/',
    labelKey: 'nav.dashboard',
    defaultLabel: 'Dashboard',
    icon: LayoutDashboard,
  },
  groups: [
    {
      id: 'sales',
      titleKey: 'nav.grpSales',
      defaultTitle: 'SALES',
      icon: Kanban,
      items: [
        { href: '/deals', labelKey: 'nav.deals', defaultLabel: 'Deals', icon: Kanban, perms: ['deal.read'] },
        { href: '/leads', labelKey: 'nav.leads', defaultLabel: 'Leads', icon: UserCheck, perms: ['lead.read'] },
        { href: '/leads/groups', labelKey: 'nav.leadGroups', defaultLabel: 'Lead Groups', icon: FolderKanban, perms: ['lead.read'] },
        { href: '/contacts', labelKey: 'nav.contacts', defaultLabel: 'Contacts', icon: Users, perms: ['contact.read'] },
        { href: '/contacts/segments', labelKey: 'nav.segments', defaultLabel: 'Segments', icon: Sliders, perms: ['contact.read'] },
        { href: '/pipeline', labelKey: 'nav.pipeline', defaultLabel: 'Sales Stages', icon: GitCommit, perms: ['pipeline.read'] },
      ],
    },
    {
      id: 'marketing',
      titleKey: 'nav.grpMarketing',
      defaultTitle: 'MARKETING',
      icon: Mail,
      items: [
        { href: '/campaigns/email', labelKey: 'nav.emailCampaigns', defaultLabel: 'Email Campaigns', icon: Mail, perms: ['campaign.read', 'deal.read'] },
        { href: '/campaigns/sms', labelKey: 'nav.smsCampaigns', defaultLabel: 'SMS Campaigns', icon: Smartphone, perms: ['campaign.read', 'deal.read'] },
        { href: '/campaigns/templates', labelKey: 'nav.templates', defaultLabel: 'Email Templates', icon: FileCode, perms: ['template.read', 'deal.read'] },
        { href: '/campaigns/warmup', labelKey: 'nav.warmup', defaultLabel: 'Email Warmup', icon: Flame, perms: ['campaign.read', 'deal.read'] },
        { href: '/funnels', labelKey: 'nav.funnels', defaultLabel: 'Funnels', icon: Layers, perms: ['funnel.read', 'deal.read'] },
        { href: '/automation', labelKey: 'nav.automation', defaultLabel: 'Automated Rules', icon: Zap, perms: ['automation.manage', 'automation.read'] },
      ],
    },
    {
      id: 'messaging',
      titleKey: 'nav.grpMessaging',
      defaultTitle: 'MESSAGING',
      icon: MessageSquare,
      items: [
        { href: '/whatsapp', labelKey: 'nav.whatsappInbox', defaultLabel: 'WhatsApp Inbox', icon: MessageSquare, perms: ['whatsapp.read'] },
        { href: '/whatsapp/broadcasts', labelKey: 'nav.whatsappBroadcasts', defaultLabel: 'Broadcasts', icon: Radio, perms: ['whatsapp.read'] },
        { href: '/whatsapp/templates', labelKey: 'nav.whatsappTemplates', defaultLabel: 'WhatsApp Templates', icon: FileText, perms: ['whatsapp.read'] },
        { href: '/whatsapp/quick-replies', labelKey: 'nav.quickReplies', defaultLabel: 'Quick Replies', icon: Zap, perms: ['whatsapp.read'] },
        { href: '/whatsapp/workflows', labelKey: 'nav.whatsappWorkflows', defaultLabel: 'Workflows', icon: GitBranch, perms: ['whatsapp.read'] },
      ],
    },
    {
      id: 'support',
      titleKey: 'nav.grpActivity',
      defaultTitle: 'SUPPORT & TASKS',
      icon: LifeBuoy,
      items: [
        { href: '/tickets', labelKey: 'nav.tickets', defaultLabel: 'Tickets', icon: LifeBuoy, perms: ['ticket.read'] },
        { href: '/tasks', labelKey: 'nav.tasks', defaultLabel: 'Tasks', icon: CheckSquare, perms: ['task.read'] },
        { href: '/meetings', labelKey: 'nav.meetings', defaultLabel: 'Meetings', icon: Calendar, perms: ['meeting.read'] },
        { href: '/support', labelKey: 'nav.supportPortal', defaultLabel: 'Help & Support', icon: HelpCircle, perms: ['support.read', 'ticket.read'] },
      ],
    },
    {
      id: 'finance',
      titleKey: 'nav.grpFinance',
      defaultTitle: 'FINANCE & CPQ',
      icon: Receipt,
      items: [
        { href: '/products', labelKey: 'nav.products', defaultLabel: 'Products', icon: Package, perms: ['product.read'] },
        { href: '/masters/tax-slabs', labelKey: 'nav.taxSlabs', defaultLabel: 'Tax Slabs', icon: Scale, perms: ['product.read', 'invoice.read'] },
        { href: '/masters/uom', labelKey: 'nav.uom', defaultLabel: 'UOM Masters', icon: Boxes, perms: ['product.read', 'invoice.read'] },
        { href: '/masters/tnc-sets', labelKey: 'nav.tncSets', defaultLabel: 'T&C Sets', icon: FileCheck, perms: ['quote.read', 'invoice.read'] },
        { href: '/quotes', labelKey: 'nav.quotes', defaultLabel: 'Quotes', icon: FileSpreadsheet, perms: ['quote.read'] },
        { href: '/invoices', labelKey: 'nav.invoices', defaultLabel: 'Invoices', icon: Receipt, perms: ['invoice.read_financial', 'invoice.create', 'invoice.update', 'invoice.read'] },
      ],
    },
    {
      id: 'insights',
      titleKey: 'nav.grpInsights',
      defaultTitle: 'INSIGHTS & AI',
      icon: BarChart3,
      items: [
        { href: '/reports', labelKey: 'nav.reports', defaultLabel: 'Reports', icon: BarChart3, perms: ['deal.read', 'invoice.read_financial'] },
        { href: '/reports/custom', labelKey: 'nav.customReport', defaultLabel: 'Custom Report', icon: LineChart, perms: ['deal.read', 'custom_report.read'] },
        { href: '/ai', labelKey: 'nav.ai', defaultLabel: 'AI Assistant', icon: Bot, perms: ['ai.use'], badge: 'ai' },
        { href: '/brands', labelKey: 'nav.brands', defaultLabel: 'Competitors', icon: Sparkles, perms: ['brand.read'] },
      ],
    },
    {
      id: 'resources',
      titleKey: 'nav.grpResources',
      defaultTitle: 'RESOURCES & FORMS',
      icon: FolderOpen,
      items: [
        { href: '/media', labelKey: 'nav.media', defaultLabel: 'Media Library', icon: FolderOpen, perms: ['media.read', 'deal.read'] },
        { href: '/lead-forms', labelKey: 'nav.leadForms', defaultLabel: 'Website Forms', icon: FileText, perms: ['lead_form.manage', 'lead_form.read'] },
        { href: '/connections', labelKey: 'nav.connections', defaultLabel: 'App Connections', icon: Network, perms: ['integration.manage', 'integration.read'] },
        { href: '/integrations', labelKey: 'nav.integrations', defaultLabel: 'Webhooks', icon: Plug, perms: ['integration.manage'] },
        { href: '/custom-fields', labelKey: 'nav.customFields', defaultLabel: 'Custom Fields', icon: SlidersHorizontal, perms: ['custom_field.manage', 'custom_field.read'] },
      ],
    },
    {
      id: 'admin',
      titleKey: 'nav.grpAdmin',
      defaultTitle: 'ADMIN & TEAM',
      icon: Settings,
      items: [
        { href: '/settings', labelKey: 'nav.masterSettings', defaultLabel: 'Master Settings', icon: Settings, perms: ['tenant.manage', 'user.create'] },
        { href: '/users', labelKey: 'nav.users', defaultLabel: 'Team Members', icon: UserCog, perms: ['user.create', 'user.update', 'user.delete'] },
        { href: '/roles', labelKey: 'nav.roles', defaultLabel: 'Team Roles', icon: ShieldCheck, perms: ['role.create', 'role.update', 'role.delete', 'role.assign'] },
        { href: '/tenants', labelKey: 'nav.tenants', defaultLabel: 'Workspaces', icon: Building2, perms: ['platform.tenant.manage'] },
        { href: '/settings/my-plan', labelKey: 'nav.myPlan', defaultLabel: 'My Plan', icon: CreditCard, perms: ['tenant.manage', 'user.create'] },
        { href: '/data', labelKey: 'nav.data', defaultLabel: 'Import / Export', icon: Database, perms: ['data.import', 'data.merge', 'data.export'] },
        { href: '/audit', labelKey: 'nav.audit', defaultLabel: 'Activity Log', icon: ShieldAlert, perms: ['audit.read'] },
      ],
    },
    {
      id: 'prefs',
      titleKey: 'nav.grpPrefs',
      defaultTitle: 'PREFERENCES',
      icon: Globe,
      items: [
        { href: '/language', labelKey: 'nav.language', defaultLabel: 'Language', icon: Globe },
      ],
    },
  ],
};
