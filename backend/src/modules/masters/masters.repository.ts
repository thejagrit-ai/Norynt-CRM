// src/modules/masters/masters.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaxSlabDto, CreateTncSetDto, CreateUomDto } from './dto/masters.dto';

@Injectable()
export class MastersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Tax Slabs ---
  async createTaxSlab(data: CreateTaxSlabDto, tenantId?: string | null) {
    return this.prisma.taxSlab.create({
      data: {
        name: data.name,
        rate: data.rate,
        cgstRate: data.cgstRate ?? 0,
        sgstRate: data.sgstRate ?? 0,
        igstRate: data.igstRate ?? 0,
        isDefault: data.isDefault ?? false,
        tenantId: tenantId ?? null,
      },
    });
  }

  async findAllTaxSlabs(tenantId?: string | null) {
    return this.prisma.taxSlab.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { rate: 'asc' },
    });
  }

  async updateTaxSlab(id: string, data: any) {
    return this.prisma.taxSlab.update({ where: { id }, data });
  }

  async deleteTaxSlab(id: string) {
    return this.prisma.taxSlab.delete({ where: { id } });
  }

  // --- UOM ---
  async createUom(data: CreateUomDto, tenantId?: string | null) {
    return this.prisma.unitOfMeasure.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        symbol: data.symbol,
        precision: data.precision ?? 0,
        tenantId: tenantId ?? null,
      },
    });
  }

  async findAllUoms(tenantId?: string | null) {
    return this.prisma.unitOfMeasure.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { code: 'asc' },
    });
  }

  async updateUom(id: string, data: any) {
    return this.prisma.unitOfMeasure.update({ where: { id }, data });
  }

  async deleteUom(id: string) {
    return this.prisma.unitOfMeasure.delete({ where: { id } });
  }

  // --- T&C Sets ---
  async createTncSet(data: CreateTncSetDto, tenantId?: string | null) {
    return this.prisma.termsConditionSet.create({
      data: {
        title: data.title,
        type: data.type || 'QUOTATION',
        content: data.content,
        isDefault: data.isDefault ?? false,
        tenantId: tenantId ?? null,
      },
    });
  }

  async findAllTncSets(tenantId?: string | null) {
    return this.prisma.termsConditionSet.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTncSet(id: string, data: any) {
    return this.prisma.termsConditionSet.update({ where: { id }, data });
  }

  async deleteTncSet(id: string) {
    return this.prisma.termsConditionSet.delete({ where: { id } });
  }
}
