// src/modules/lead-forms/lead-forms.repository.ts
// VERİ ERİŞİMİ: Prisma çağrıları YALNIZCA burada (LeadForm).
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeadFormsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.LeadFormCreateInput) {
    return this.prisma.leadForm.create({ data });
  }

  findById(id: string) {
    return this.prisma.leadForm.findFirst({ where: { id } });
  }

  // Public yol (embed/webhook): tenant context yoktur → global publicKey araması.
  findByPublicKey(publicKey: string) {
    return this.prisma.leadForm.findUnique({ where: { publicKey } });
  }

  async list(where: Prisma.LeadFormWhereInput, skip: number, take: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.leadForm.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leadForm.count({ where }),
    ]);
    return { items, total };
  }

  update(id: string, data: Prisma.LeadFormUpdateInput) {
    return this.prisma.leadForm.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.leadForm.delete({ where: { id } });
  }

  // Submit sayacı (atomik). tenant scope uygulanmaz: id zaten benzersiz.
  incrementSubmit(id: string) {
    return this.prisma.leadForm.update({
      where: { id },
      data: { submitCount: { increment: 1 } },
    });
  }
}
