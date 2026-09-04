// src/modules/masters/masters.service.ts
import { Injectable } from '@nestjs/common';
import { MastersRepository } from './masters.repository';
import { CreateTaxSlabDto, CreateTncSetDto, CreateUomDto } from './dto/masters.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class MastersService {
  constructor(private readonly repo: MastersRepository) {}

  // --- Tax Slabs ---
  async findAllTaxSlabs(actor: AuthenticatedUser) {
    let slabs = await this.repo.findAllTaxSlabs(actor.tenantId);
    if (slabs.length === 0) {
      const defaults = [
        { name: 'Zero Tax (0%)', rate: 0, cgstRate: 0, sgstRate: 0, igstRate: 0, isDefault: false },
        { name: 'Standard GST (18%)', rate: 18, cgstRate: 9, sgstRate: 9, igstRate: 18, isDefault: true },
        { name: 'Reduced Rate (5%)', rate: 5, cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, isDefault: false },
        { name: 'Standard VAT (20%)', rate: 20, cgstRate: 0, sgstRate: 0, igstRate: 20, isDefault: false },
      ];
      slabs = await Promise.all(defaults.map((d) => this.repo.createTaxSlab(d, actor.tenantId)));
    }
    return slabs;
  }

  async createTaxSlab(dto: CreateTaxSlabDto, actor: AuthenticatedUser) {
    return this.repo.createTaxSlab(dto, actor.tenantId);
  }

  async updateTaxSlab(id: string, dto: any) {
    return this.repo.updateTaxSlab(id, dto);
  }

  async deleteTaxSlab(id: string) {
    return this.repo.deleteTaxSlab(id);
  }

  // --- UOM ---
  async findAllUoms(actor: AuthenticatedUser) {
    let uoms = await this.repo.findAllUoms(actor.tenantId);
    if (uoms.length === 0) {
      const defaults = [
        { code: 'PCS', name: 'Pieces', symbol: 'pc', precision: 0 },
        { code: 'KG', name: 'Kilograms', symbol: 'kg', precision: 2 },
        { code: 'BOX', name: 'Box', symbol: 'bx', precision: 0 },
        { code: 'HRS', name: 'Hours', symbol: 'hr', precision: 1 },
        { code: 'MONTH', name: 'Months', symbol: 'mo', precision: 0 },
        { code: 'SET', name: 'Set', symbol: 'set', precision: 0 },
      ];
      uoms = await Promise.all(defaults.map((d) => this.repo.createUom(d, actor.tenantId)));
    }
    return uoms;
  }

  async createUom(dto: CreateUomDto, actor: AuthenticatedUser) {
    return this.repo.createUom(dto, actor.tenantId);
  }

  async updateUom(id: string, dto: any) {
    return this.repo.updateUom(id, dto);
  }

  async deleteUom(id: string) {
    return this.repo.deleteUom(id);
  }

  // --- T&C Sets ---
  async findAllTncSets(actor: AuthenticatedUser) {
    let sets = await this.repo.findAllTncSets(actor.tenantId);
    if (sets.length === 0) {
      const defaults = [
        {
          title: 'Standard Quotation Terms',
          type: 'QUOTATION',
          content: '1. Quotation is valid for 30 calendar days from issuance.\n2. Payment: 50% advance on order confirmation, 50% prior to dispatch.\n3. Delivery timeframe starts upon receipt of advance payment.\n4. All taxes are calculated according to local statutory laws.',
          isDefault: true,
        },
        {
          title: 'Service & SLA Terms',
          type: 'INVOICE',
          content: '1. Net payment due within 14 days of invoice receipt.\n2. Invoices overdue by >15 days accrue 1.5% late fee per month.\n3. Support coverage is provided under Tier-1 Enterprise SLA.',
          isDefault: false,
        },
      ];
      sets = await Promise.all(defaults.map((d) => this.repo.createTncSet(d, actor.tenantId)));
    }
    return sets;
  }

  async createTncSet(dto: CreateTncSetDto, actor: AuthenticatedUser) {
    return this.repo.createTncSet(dto, actor.tenantId);
  }

  async updateTncSet(id: string, dto: any) {
    return this.repo.updateTncSet(id, dto);
  }

  async deleteTncSet(id: string) {
    return this.repo.deleteTncSet(id);
  }
}
