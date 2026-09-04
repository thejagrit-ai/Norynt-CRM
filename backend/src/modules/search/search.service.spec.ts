// src/modules/search/search.service.spec.ts
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from './search.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

describe('SearchService', () => {
  let prisma: {
    deal: { findMany: jest.Mock };
    contact: { findMany: jest.Mock };
    company: { findMany: jest.Mock };
  };
  let service: SearchService;

  beforeEach(() => {
    prisma = {
      deal: { findMany: jest.fn().mockResolvedValue([{ id: 'd1' }]) },
      contact: { findMany: jest.fn().mockResolvedValue([{ id: 'c1' }]) },
      company: { findMany: jest.fn().mockResolvedValue([{ id: 'co1' }]) },
    };
    service = new SearchService(prisma as unknown as PrismaService);
  });

  const userWith = (perms: string[]): AuthenticatedUser => ({
    id: 'u-1',
    email: 'a@crm.dev',
    roles: [],
    permissions: perms,
  });

  it('izne göre süzer: yalnız contact.read → sadece contacts dolu', async () => {
    const res = await service.search('ac', userWith(['contact.read']));
    expect(res.deals).toEqual([]);
    expect(res.companies).toEqual([]);
    expect(res.contacts).toEqual([{ id: 'c1' }]);
    expect(prisma.deal.findMany).not.toHaveBeenCalled();
    expect(prisma.contact.findMany).toHaveBeenCalled();
  });

  it('tüm izinler → üç koleksiyon da dolu', async () => {
    const res = await service.search(
      'ac',
      userWith(['deal.read', 'contact.read', 'company.read']),
    );
    expect(res.deals.length).toBe(1);
    expect(res.contacts.length).toBe(1);
    expect(res.companies.length).toBe(1);
  });

  it('izin yoksa hepsi boş', async () => {
    const res = await service.search('ac', userWith([]));
    expect(res.deals).toEqual([]);
    expect(res.contacts).toEqual([]);
    expect(res.companies).toEqual([]);
  });
});
