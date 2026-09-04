// backend/prisma/seed-demo.ts
// Indian Business CRM Demo Seed: Rich, multi-month data for Indian Enterprise Ecosystem.
// Tailored with INR (₹) values, GST tax rates, Indian metro cities, companies, contacts, and WhatsApp commerce.
// Run via: npm run seed:demo

import {
  PrismaClient,
  InvoiceStatus,
  TaskStatus,
  TaskPriority,
  TicketStatus,
  TicketPriority,
  DealStatus,
  LeadStatus,
  LeadChannel,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Demo!2026';

const DEMO_USERS = [
  { email: 'admin@crm.dev', firstName: 'Rajesh', lastName: 'Sharma (Admin)', role: 'ADMIN' },
  { email: 'manager@crm.dev', firstName: 'Priya', lastName: 'Patel (Manager)', role: 'MANAGER' },
  { email: 'sales@crm.dev', firstName: 'Amit', lastName: 'Verma (Sales AE)', role: 'SALES' },
  { email: 'finance@crm.dev', firstName: 'Vikram', lastName: 'Malhotra (Finance)', role: 'FINANCE' },
  { email: 'viewer@crm.dev', firstName: 'Sneha', lastName: 'Iyer (Viewer)', role: 'VIEWER' },
];

function dateMonthsAgo(monthsAgo: number, dayOffset = 0): Date {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  d.setUTCDate(Math.min(28, Math.max(1, d.getUTCDate() + dayOffset)));
  return d;
}

async function main() {
  const cost = Number(process.env.BCRYPT_COST ?? 12);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, cost);

  console.log('🇮🇳 Seeding Indian Enterprise CRM data (INR ₹, GST, Indian Companies & Contacts)...');

  // 1) Users
  const userIdByRole: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    const role = await prisma.role.findUnique({ where: { name: u.role } });
    if (!role) continue;
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { firstName: u.firstName, lastName: u.lastName },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
      },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
    userIdByRole[u.role] = user.id;
  }

  const adminId = userIdByRole['ADMIN'] ?? userIdByRole['MANAGER'];
  const salesId = userIdByRole['SALES'] ?? adminId;
  const financeId = userIdByRole['FINANCE'] ?? adminId;
  const managerId = userIdByRole['MANAGER'] ?? adminId;

  // 2) Indian Companies
  const indianCompanies = [
    { name: 'Tata Consultancy Services (TCS)', domain: 'tcs.com', industry: 'IT & Cloud Solutions', phone: '+91 22 6778 9999', website: 'https://tcs.com' },
    { name: 'Reliance Jio Enterprise', domain: 'jio.com', industry: 'Telecom & 5G Infrastructure', phone: '+91 22 4477 8899', website: 'https://jio.com' },
    { name: 'Infosys Digital Operations', domain: 'infosys.com', industry: 'Enterprise SaaS & BPM', phone: '+91 80 2852 0261', website: 'https://infosys.com' },
    { name: 'Zomato Limited', domain: 'zomato.com', industry: 'FoodTech & Hyperlocal Delivery', phone: '+91 124 415 6600', website: 'https://zomato.com' },
    { name: 'Swiggy Instamart Technologies', domain: 'swiggy.in', industry: 'Quick-Commerce & Retail', phone: '+91 80 6746 6777', website: 'https://swiggy.in' },
    { name: 'HDFC Bank Corporate Banking', domain: 'hdfcbank.com', industry: 'Banking & Financial Services', phone: '+91 22 6652 1000', website: 'https://hdfcbank.com' },
    { name: 'Razorpay Software Private Limited', domain: 'razorpay.com', industry: 'FinTech & Payments Gateway', phone: '+91 80 4666 9555', website: 'https://razorpay.com' },
    { name: 'Flipkart Logistics & Ekart', domain: 'flipkart.com', industry: 'E-Commerce & Supply Chain', phone: '+91 80 4660 4000', website: 'https://flipkart.com' },
    { name: 'Zoho Corporation Private Limited', domain: 'zohocorp.com', industry: 'B2B Software & Cloud Suite', phone: '+91 44 6744 7070', website: 'https://zohocorp.com' },
    { name: 'Nykaa E-Retail Private Limited', domain: 'nykaa.com', industry: 'Omni-Channel Beauty & DTC', phone: '+91 22 6614 9600', website: 'https://nykaa.com' },
    { name: 'Ola Electric Technologies', domain: 'olaelectric.com', industry: 'EV Mobility & CleanTech', phone: '+91 80 3355 3355', website: 'https://olaelectric.com' },
    { name: 'Paytm Payments Services', domain: 'paytm.com', industry: 'Digital Payments & Commerce', phone: '+91 120 4770 770', website: 'https://paytm.com' },
  ];

  const companyMap = new Map<string, string>();
  for (const c of indianCompanies) {
    const existing = await prisma.company.findFirst({ where: { name: c.name } });
    if (existing) {
      companyMap.set(c.name, existing.id);
    } else {
      const created = await prisma.company.create({
        data: {
          name: c.name,
          domain: c.domain,
          industry: c.industry,
          phone: c.phone,
          website: c.website,
          ownerId: salesId,
        },
      });
      companyMap.set(c.name, created.id);
    }
  }

  // 3) Indian Contacts
  const indianContacts = [
    { firstName: 'Rajesh', lastName: 'Sharma', email: 'rajesh.sharma@tcs.com', title: 'VP Enterprise Solutions', companyName: 'Tata Consultancy Services (TCS)', phone: '+91 98201 44556', roleType: 'DECISION_MAKER' },
    { firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@jio.com', title: 'Chief Technology Officer', companyName: 'Reliance Jio Enterprise', phone: '+91 98192 33445', roleType: 'EXECUTIVE_SPONSOR' },
    { firstName: 'Amit', lastName: 'Verma', email: 'amit.verma@zomato.com', title: 'Director Procurement & Vendor Ops', companyName: 'Zomato Limited', phone: '+91 98110 55667', roleType: 'PROCUREMENT' },
    { firstName: 'Sneha', lastName: 'Iyer', email: 'sneha.iyer@swiggy.in', title: 'Head of Digital Growth & CRM', companyName: 'Swiggy Instamart Technologies', phone: '+91 99401 22334', roleType: 'CHAMPION' },
    { firstName: 'Vikram', lastName: 'Malhotra', email: 'vikram.malhotra@razorpay.com', title: 'Chief Financial Officer', companyName: 'Razorpay Software Private Limited', phone: '+91 98450 77889', roleType: 'DECISION_MAKER' },
    { firstName: 'Ananya', lastName: 'Desai', email: 'ananya.desai@flipkart.com', title: 'VP Supply Chain Automation', companyName: 'Flipkart Logistics & Ekart', phone: '+91 97410 88990', roleType: 'TECHNICAL' },
    { firstName: 'Rohit', lastName: 'Deshmukh', email: 'rohit.deshmukh@hdfcbank.com', title: 'Head of Omni-Channel Banking', companyName: 'HDFC Bank Corporate Banking', phone: '+91 98220 11223', roleType: 'DECISION_MAKER' },
    { firstName: 'Kavita', lastName: 'Reddy', email: 'kavita.reddy@zohocorp.com', title: 'Product Operations Director', companyName: 'Zoho Corporation Private Limited', phone: '+91 94440 66778', roleType: 'CHAMPION' },
    { firstName: 'Arjun', lastName: 'Kapoor', email: 'arjun.kapoor@olaelectric.com', title: 'Director Telematics Infrastructure', companyName: 'Ola Electric Technologies', phone: '+91 99800 44332', roleType: 'TECHNICAL' },
    { firstName: 'Meera', lastName: 'Nair', email: 'meera.nair@nykaa.com', title: 'Head of Retail Experience', companyName: 'Nykaa E-Retail Private Limited', phone: '+91 98210 99887', roleType: 'CHAMPION' },
  ];

  const contactMap = new Map<string, string>();
  for (const ct of indianContacts) {
    const existing = await prisma.contact.findFirst({ where: { email: ct.email } });
    if (existing) {
      contactMap.set(ct.email, existing.id);
    } else {
      const created = await prisma.contact.create({
        data: {
          firstName: ct.firstName,
          lastName: ct.lastName,
          email: ct.email,
          title: ct.title,
          phone: ct.phone,
          roleType: ct.roleType,
          companyId: companyMap.get(ct.companyName),
          ownerId: salesId,
        },
      });
      contactMap.set(ct.email, created.id);
    }
  }

  // 4) Pipeline & Multi-Month Deals in INR (₹ Lakhs & Crores)
  const pipeline = await prisma.pipeline.findFirst({
    where: { isDefault: true },
    include: { stages: { orderBy: { position: 'asc' } } },
  });

  let seededDealsCount = 0;
  if (pipeline && pipeline.stages.length >= 5) {
    const stages = pipeline.stages;
    const stageNew = stages[0];
    const stageContact = stages[1];
    const stageProposal = stages[2];
    const stageWon = stages.find((s) => s.isWon) ?? stages[3];
    const stageLost = stages.find((s) => s.isLost) ?? stages[4];

    await prisma.dealActivity.deleteMany({});
    await prisma.deal.deleteMany({});

    const indianDealsToSeed = [
      // Multi-month Won Deals in INR (Lakhs / Crores)
      { title: 'Reliance Jio 5G Private APN Core Integration', company: 'Reliance Jio Enterprise', value: '8500000.00', stage: stageWon, status: DealStatus.WON, monthsAgo: 5, ownerId: salesId, contactEmail: 'priya.patel@jio.com', prob: 100 },
      { title: 'TCS Enterprise Cloud Governance Migration', company: 'Tata Consultancy Services (TCS)', value: '14000000.00', stage: stageWon, status: DealStatus.WON, monthsAgo: 4, ownerId: managerId, contactEmail: 'rajesh.sharma@tcs.com', prob: 100 },
      { title: 'HDFC Bank Omni-Channel WhatsApp Banking Platform', company: 'HDFC Bank Corporate Banking', value: '6500000.00', stage: stageWon, status: DealStatus.WON, monthsAgo: 3, ownerId: salesId, contactEmail: 'rohit.deshmukh@hdfcbank.com', prob: 100 },
      { title: 'Zomato Delivery Fleet Support Command Center', company: 'Zomato Limited', value: '4800000.00', stage: stageWon, status: DealStatus.WON, monthsAgo: 2, ownerId: salesId, contactEmail: 'amit.verma@zomato.com', prob: 100 },
      { title: 'Flipkart Big Billion Day AI Traffic Radar', company: 'Flipkart Logistics & Ekart', value: '9500000.00', stage: stageWon, status: DealStatus.WON, monthsAgo: 1, ownerId: managerId, contactEmail: 'ananya.desai@flipkart.com', prob: 100 },
      { title: 'Swiggy Instamart Dark Store Inventory Sync', company: 'Swiggy Instamart Technologies', value: '3600000.00', stage: stageWon, status: DealStatus.WON, monthsAgo: 0, ownerId: salesId, contactEmail: 'sneha.iyer@swiggy.in', prob: 100 },

      // Lost deals
      { title: 'Legacy On-Premise ERP Maintenance', company: 'Infosys Digital Operations', value: '1800000.00', stage: stageLost, status: DealStatus.LOST, monthsAgo: 4, ownerId: salesId, prob: 0 },
      { title: 'Local Delivery Fleet SMS Blaster', company: 'Paytm Payments Services', value: '1200000.00', stage: stageLost, status: DealStatus.LOST, monthsAgo: 2, ownerId: salesId, prob: 0 },

      // Active Open Pipeline Deals in INR
      { title: 'Razorpay Merchant Dispute Auto-Resolution Engine', company: 'Razorpay Software Private Limited', value: '5400000.00', stage: stageProposal, status: DealStatus.OPEN, monthsAgo: 0, ownerId: salesId, contactEmail: 'vikram.malhotra@razorpay.com', prob: 80 },
      { title: 'Zoho Multi-Cloud API Gateway Expansion', company: 'Zoho Corporation Private Limited', value: '4200000.00', stage: stageProposal, status: DealStatus.OPEN, monthsAgo: 0, ownerId: salesId, contactEmail: 'kavita.reddy@zohocorp.com', prob: 75 },
      { title: 'Ola Electric Battery Telemetry & IoT Cloud', company: 'Ola Electric Technologies', value: '7800000.00', stage: stageContact, status: DealStatus.OPEN, monthsAgo: 0, ownerId: managerId, contactEmail: 'arjun.kapoor@olaelectric.com', prob: 50 },
      { title: 'Nykaa Beauty Advisor Automated AI Concierge', company: 'Nykaa E-Retail Private Limited', value: '2800000.00', stage: stageNew, status: DealStatus.OPEN, monthsAgo: 0, ownerId: salesId, contactEmail: 'meera.nair@nykaa.com', prob: 30 },
      { title: 'Paytm UPI Auto-Pay Reconciliation Suite', company: 'Paytm Payments Services', value: '3200000.00', stage: stageContact, status: DealStatus.OPEN, monthsAgo: 0, ownerId: salesId, prob: 45 },
    ];

    let rank = 1;
    for (const d of indianDealsToSeed) {
      const dt = dateMonthsAgo(d.monthsAgo, (rank % 5) * 3);
      await prisma.deal.create({
        data: {
          pipelineId: pipeline.id,
          stageId: d.stage.id,
          title: d.title,
          company: d.company,
          companyId: companyMap.get(d.company),
          contactId: d.contactEmail ? contactMap.get(d.contactEmail) : undefined,
          value: d.value,
          currency: 'INR',
          rank: rank++,
          ownerId: d.ownerId,
          status: d.status,
          healthScore: d.status === DealStatus.WON ? 100 : d.status === DealStatus.LOST ? 20 : 85,
          createdAt: dt,
          updatedAt: dt,
        },
      });
    }
    seededDealsCount = indianDealsToSeed.length;
  }

  // 5) Invoices & Payments in INR (₹) with 18% GST & GSTINs
  await prisma.payment.deleteMany({});
  await prisma.invoiceLineItem.deleteMany({});
  await prisma.invoice.deleteMany({});

  const indianInvoices = [
    { monthsAgo: 5, num: 'INV-2026-IND-101', customer: 'Reliance Jio Enterprise', subtotal: '850000.00', tax: '153000.00', total: '1003000.00', paid: '1003000.00', status: InvoiceStatus.PAID, gstin: '27AAACR1234F1Z1' },
    { monthsAgo: 4, num: 'INV-2026-IND-102', customer: 'Tata Consultancy Services (TCS)', subtotal: '1400000.00', tax: '252000.00', total: '1652000.00', paid: '1652000.00', status: InvoiceStatus.PAID, gstin: '27AAACT0001A1Z8' },
    { monthsAgo: 3, num: 'INV-2026-IND-103', customer: 'HDFC Bank Corporate Banking', subtotal: '650000.00', tax: '117000.00', total: '767000.00', paid: '767000.00', status: InvoiceStatus.PAID, gstin: '27AAACH1111Q1Z9' },
    { monthsAgo: 2, num: 'INV-2026-IND-104', customer: 'Zomato Limited', subtotal: '480000.00', tax: '86400.00', total: '566400.00', paid: '350000.00', status: InvoiceStatus.PARTIALLY_PAID, gstin: '07AAACZ9999P1Z2' },
    { monthsAgo: 1, num: 'INV-2026-IND-105', customer: 'Flipkart Logistics & Ekart', subtotal: '950000.00', tax: '171000.00', total: '1121000.00', paid: '1121000.00', status: InvoiceStatus.PAID, gstin: '29AABCF4444N1Z5' },
    { monthsAgo: 0, num: 'INV-2026-IND-106', customer: 'Razorpay Software Private Limited', subtotal: '540000.00', tax: '97200.00', total: '637200.00', paid: '0.00', status: InvoiceStatus.SENT, gstin: '29AABCR8888P1Z4' },
    { monthsAgo: 0, num: 'INV-2026-IND-107', customer: 'Swiggy Instamart Technologies', subtotal: '360000.00', tax: '64800.00', total: '424800.00', paid: '0.00', status: InvoiceStatus.SENT, gstin: '29AABCS7777K1Z6' },
  ];

  for (const inv of indianInvoices) {
    const invDate = dateMonthsAgo(inv.monthsAgo, 5);
    const createdInv = await prisma.invoice.create({
      data: {
        number: inv.num,
        customerName: inv.customer,
        customerEmail: `billing@${inv.customer.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        status: inv.status,
        currency: 'INR',
        subtotal: inv.subtotal,
        taxRate: '18.00', // 18% GST
        taxAmount: inv.tax,
        total: inv.total,
        amountPaid: inv.paid,
        issuedAt: invDate,
        dueAt: new Date(invDate.getTime() + 30 * 24 * 3600 * 1000),
        createdById: financeId,
        createdAt: invDate,
        updatedAt: invDate,
        lineItems: {
          create: [
            {
              description: 'Norynt Enterprise CRM Platform & WhatsApp Cloud API License (18% GST Applicable)',
              quantity: '1',
              unitPrice: inv.subtotal,
              lineTotal: inv.subtotal,
            },
          ],
        },
      },
    });

    if (Number(inv.paid) > 0) {
      await prisma.payment.create({
        data: {
          invoiceId: createdInv.id,
          amount: inv.paid,
          method: 'BANK',
          reference: `NEFT/RTGS-HDFC-${inv.num}`,
          paidAt: invDate,
          recordedById: financeId,
        },
      });
    }
  }

  // 6) Indian Products (INR ₹)
  await prisma.product.deleteMany({});
  const indianProducts = [
    { sku: 'NORYNT-ENT-YR', name: 'Norynt Enterprise Cloud CRM Suite', description: 'Complete omni-channel sales CRM with WhatsApp API, unlimited pipelines and RBAC', unitPrice: '180000.00', currency: 'INR', taxRate: '18.00' },
    { sku: 'WA-GREEN-TICK-MO', name: 'WhatsApp Official Cloud API Green Tick Bundle', description: 'Meta verified green badge WhatsApp broadcast engine with 25,000 monthly HSM credits', unitPrice: '45000.00', currency: 'INR', taxRate: '18.00' },
    { sku: 'AI-STUDIO-YR', name: 'AI Chatbot Studio & RAG Prompt Grounding', description: 'Autonomous 24/7 AI sales concierge with custom knowledge base ingestion', unitPrice: '75000.00', currency: 'INR', taxRate: '18.00' },
    { sku: 'FIELD-GEO-REP', name: 'Field Sales Mobile Tracking & Geofencing Module', description: 'Real-time GPS visit check-ins, route planning and meeting logging for on-ground sales reps', unitPrice: '25000.00', currency: 'INR', taxRate: '18.00' },
    { sku: 'SLA-DEDICATED-IND', name: 'Dedicated Indian Support Director & 15-Min SLA', description: '24/7 Priority Indian toll-free support, on-call technical engineers and monthly business reviews', unitPrice: '120000.00', currency: 'INR', taxRate: '18.00' },
    { sku: 'GST-EINVOICE-API', name: 'GST e-Invoicing & Automated IRN Reconciliation', description: 'Direct NIC / GSTN portal connector for real-time QR code generation on tax invoices', unitPrice: '35000.00', currency: 'INR', taxRate: '18.00' },
  ];

  for (const p of indianProducts) {
    await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        unitPrice: p.unitPrice,
        currency: p.currency,
        taxRate: p.taxRate,
        active: true,
      },
    });
  }

  // 7) Indian Leads with INR budgets & Indian Cities
  await prisma.lead.deleteMany({});
  const indianLeads = [
    { firstName: 'Rakesh', lastName: 'Agarwal', email: 'rakesh.agarwal@agarwallogistics.in', phone: '+91 98101 23456', companyName: 'Agarwal Freight Carriers (Delhi NCR)', source: 'WhatsApp Inbound', channel: LeadChannel.API, status: LeadStatus.NEW },
    { firstName: 'Pooja', lastName: 'Hegde', email: 'pooja@bangalorefintech.io', phone: '+91 98860 34567', companyName: 'Bangalore FinTech Labs (Bengaluru)', source: 'Google India Search Ads', channel: LeadChannel.FORM, status: LeadStatus.WORKING },
    { firstName: 'Nitin', lastName: 'Gadve', email: 'nitin.gadve@puneautotech.com', phone: '+91 98230 45678', companyName: 'Pune Precision Auto Tech (Pune)', source: 'Partner Referral (Mumbai Summit)', channel: LeadChannel.MANUAL, status: LeadStatus.QUALIFIED },
    { firstName: 'Sunita', lastName: 'Rao', email: 'sunita.rao@hyderabadpharma.org', phone: '+91 98490 56789', companyName: 'Hyderabad Pharma Solutions (Hyderabad)', source: 'Website Demo Request', channel: LeadChannel.FORM, status: LeadStatus.QUALIFIED },
    { firstName: 'Alok', lastName: 'Singhania', email: 'alok@singhaniatex.com', phone: '+91 98250 67890', companyName: 'Singhania Textiles & Retail (Ahmedabad)', source: 'Cold Inbound / Direct Chat', channel: LeadChannel.MANUAL, status: LeadStatus.WORKING },
    { firstName: 'Karthik', lastName: 'Subramanian', email: 'karthik@chennaitechworks.com', phone: '+91 98400 78901', companyName: 'Chennai Cloud Works (Chennai)', source: 'LinkedIn Inbound', channel: LeadChannel.MANUAL, status: LeadStatus.NEW },
  ];

  for (const ld of indianLeads) {
    await prisma.lead.create({
      data: {
        firstName: ld.firstName,
        lastName: ld.lastName,
        email: ld.email,
        phone: ld.phone,
        companyName: ld.companyName,
        source: ld.source,
        channel: ld.channel,
        status: ld.status,
        ownerId: salesId,
      },
    });
  }

  // 8) Support Tickets with Indian Business context (GST, WhatsApp, UPI)
  await prisma.ticketMessage.deleteMany({});
  await prisma.ticket.deleteMany({});

  const indianTickets = [
    { number: 'TCK-2026-IND-001', subject: 'GST e-Invoicing QR Code & IRN webhook timeout during peak filing', priority: TicketPriority.URGENT, status: TicketStatus.OPEN, company: 'Tata Consultancy Services (TCS)', desc: 'IRN e-invoicing API response latency exceeding 3000ms during month-end GST filing batch.' },
    { number: 'TCK-2026-IND-002', subject: 'WhatsApp Business API HSM Template approval for Diwali Mega Offer', priority: TicketPriority.HIGH, status: TicketStatus.PENDING, company: 'Reliance Jio Enterprise', desc: 'Meta review pending for Diwali flash sale interactive broadcast template.' },
    { number: 'TCK-2026-IND-003', subject: 'Razorpay UPI Payment Webhook signature verification error', priority: TicketPriority.HIGH, status: TicketStatus.OPEN, company: 'Razorpay Software Private Limited', desc: 'Webhook secret mismatch on payment.authorized event callback.' },
    { number: 'TCK-2026-IND-004', subject: 'Bulk CSV Lead Import format mapping for 50,000 Indian Mobile Numbers', priority: TicketPriority.MEDIUM, status: TicketStatus.OPEN, company: 'Zomato Limited', desc: 'Need automated sanitization to format Indian numbers with +91 ISD prefix.' },
  ];

  for (const tk of indianTickets) {
    await prisma.ticket.create({
      data: {
        number: tk.number,
        subject: tk.subject,
        description: tk.desc,
        priority: tk.priority,
        status: tk.status,
        companyId: companyMap.get(tk.company),
        assignedToId: adminId,
      },
    });
  }

  // 9) Tasks & Meetings with Indian Locations
  await prisma.task.deleteMany({});
  const indianTasks = [
    { title: 'Follow up on Reliance Jio ₹85 Lakhs 5G APN expansion contract', priority: TaskPriority.URGENT, status: TaskStatus.TODO, daysFromNow: 1, assigneeId: salesId, company: 'Reliance Jio Enterprise' },
    { title: 'Prepare GST Tax Invoice & IRN e-way bill for TCS annual renewal', priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, daysFromNow: 2, assigneeId: financeId, company: 'Tata Consultancy Services (TCS)' },
    { title: 'Quarterly Strategic Business Review with HDFC Bank CXO Team (BKC Mumbai)', priority: TaskPriority.HIGH, status: TaskStatus.TODO, daysFromNow: 3, assigneeId: managerId, company: 'HDFC Bank Corporate Banking' },
    { title: 'Deliver WhatsApp HSM template compliance guidelines to Swiggy Instamart', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, daysFromNow: 4, assigneeId: salesId, company: 'Swiggy Instamart Technologies' },
    { title: 'Review outstanding invoice INV-2026-IND-104 with Zomato Finance Team', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, daysFromNow: 5, assigneeId: financeId, company: 'Zomato Limited' },
    { title: 'Schedule AI Chatbot Studio product demo with Nykaa Retail Leads', priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, daysFromNow: 6, assigneeId: salesId, company: 'Nykaa E-Retail Private Limited' },
  ];

  for (const t of indianTasks) {
    const due = new Date();
    due.setDate(due.getDate() + t.daysFromNow);
    await prisma.task.create({
      data: {
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: due,
        assignedToId: t.assigneeId,
        createdById: adminId,
        companyId: companyMap.get(t.company),
      },
    });
  }

  // 10) Meetings (Indian Cities & Hubs)
  await prisma.meeting.deleteMany({});
  const indianMeetings = [
    { title: 'Executive Demo: Norynt Enterprise CRM with Tata Motors CTO', startsAt: dateMonthsAgo(0, 1), endsAt: dateMonthsAgo(0, 1), location: 'BKC, Bandra Kurla Complex, Mumbai', notes: 'Discuss multi-tenant telemetry and field sales app' },
    { title: 'Architecture Review: Razorpay UPI Auto-Pay Reconciliation', startsAt: dateMonthsAgo(0, 3), endsAt: dateMonthsAgo(0, 3), location: 'Koramangala, Bengaluru (Google Meet)', notes: 'Technical deep-dive on webhook web vault' },
    { title: 'Procurement Negotiation: Zomato Delivery Partner CRM Suite', startsAt: dateMonthsAgo(0, 5), endsAt: dateMonthsAgo(0, 5), location: 'Cyber City, Phase 2, Gurugram', notes: 'Finalizing annual contract and SLA terms' },
  ];

  for (const m of indianMeetings) {
    await prisma.meeting.create({
      data: {
        title: m.title,
        startsAt: m.startsAt,
        endsAt: m.endsAt,
        location: m.location,
        notes: m.notes,
        ownerId: salesId,
      },
    });
  }

  // 11) WhatsApp Inbound & Outbound Messages (+91 Indian numbers)
  await prisma.whatsAppMessage.deleteMany({});
  const indianWaMessages = [
    { direction: 'inbound', phone: '+919820144556', body: 'Namaste! We are reviewing the Norynt CRM proposal for TCS. Could you share the GST invoice breakdown for 18% tax?', status: 'delivered' },
    { direction: 'outbound', phone: '+919820144556', body: 'Hello Rajesh ji! Certainly, I have generated invoice INV-2026-IND-102 with full CGST 9% + SGST 9% itemized breakdown.', status: 'read' },
    { direction: 'inbound', phone: '+919819233445', body: 'Priya Patel here from Jio. The WhatsApp broadcast campaign delivered 99.4% reach for our 5G launch in Mumbai and Bengaluru.', status: 'delivered' },
    { direction: 'inbound', phone: '+919811055667', body: 'Hi Amit from Zomato. We want to expand our agent seats from 50 to 120 next month. Please send the updated quote.', status: 'delivered' },
  ];

  for (const wm of indianWaMessages) {
    await prisma.whatsAppMessage.create({
      data: {
        direction: wm.direction,
        phone: wm.phone,
        body: wm.body,
        status: wm.status,
      },
    });
  }

  console.log(`\n🎉 Indian Enterprise CRM Data Seeded Successfully!`);
  console.log(`- Indian Companies: ${indianCompanies.length} (TCS, Jio, Infosys, Zomato, Swiggy, HDFC Bank, Razorpay, Flipkart, Zoho, Nykaa, Ola, Paytm)`);
  console.log(`- Indian Contacts: ${indianContacts.length} (with +91 numbers)`);
  console.log(`- Deals in INR: ${seededDealsCount} (₹ 1.40 Cr, ₹ 85 L, ₹ 65 L, ₹ 54 L, etc.)`);
  console.log(`- GST Tax Invoices: ${indianInvoices.length} (18% GST + Indian GSTINs)`);
  console.log(`- Indian Products: ${indianProducts.length} (Enterprise Cloud CRM, WhatsApp Cloud API, AI Studio)`);
  console.log(`- Indian Leads: ${indianLeads.length} (Mumbai, Bengaluru, Delhi NCR, Pune, Hyderabad, Ahmedabad)`);
  console.log(`- Support Tickets: ${indianTickets.length} (GST e-Invoicing, WhatsApp Business API, UPI Razorpay)`);
  console.log(`- Indian Meetings & Tasks: ${indianMeetings.length + indianTasks.length}`);
  console.log(`- WhatsApp Live Chats: ${indianWaMessages.length}`);
}

main()
  .catch((e) => {
    console.error('Demo seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
