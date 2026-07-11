import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';

/** Primo argomento della prima chiamata a un jest.fn(), tipizzato senza passare per `any`. */
function firstCallArg(mockFn: jest.Mock): Record<string, unknown> {
  const calls = mockFn.mock.calls as unknown[][];
  return calls[0][0] as Record<string, unknown>;
}

/** Costruisce un mock "fluente" per una query Mongoose (find/sort/skip/limit/exec). */
function fluentQuery(result: unknown) {
  const query: Record<string, jest.Mock> = {};
  query.sort = jest.fn().mockReturnValue(query);
  query.skip = jest.fn().mockReturnValue(query);
  query.limit = jest.fn().mockReturnValue(query);
  query.exec = jest.fn().mockResolvedValue(result);
  return query;
}

describe('DocumentsService', () => {
  const user: AuthenticatedUser = {
    userId: new Types.ObjectId().toHexString(),
    householdId: new Types.ObjectId().toHexString(),
    ruolo: 'membro',
  };

  function buildService(
    overrides: {
      docModel?: Record<string, jest.Mock>;
      existsBySlug?: boolean;
    } = {},
  ) {
    const docModel = overrides.docModel ?? {
      find: jest.fn().mockReturnValue(fluentQuery([])),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
      findOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    };
    const categoriesService = {
      slugsByTipo: jest.fn().mockResolvedValue([]),
      existsBySlug: jest.fn().mockResolvedValue(overrides.existsBySlug ?? true),
    };
    const vehiclesService = {
      belongsToHousehold: jest.fn().mockResolvedValue(true),
    };
    const service = new DocumentsService(
      docModel as never,
      {} as never, // storageService
      categoriesService as never,
      {} as never, // ocrService
      {} as never, // remindersService
      vehiclesService as never,
    );
    return { service, docModel, categoriesService, vehiclesService };
  }

  describe('list — filtro di visibilità (regola non negoziabile)', () => {
    it('costruisce sempre il filtro $or (uploadedBy proprio OR household+condiviso)', async () => {
      const { service, docModel } = buildService();

      await service.list(user, {});

      const filter = firstCallArg(docModel.find);
      expect(filter.$or).toEqual([
        { uploadedBy: new Types.ObjectId(user.userId) },
        {
          householdId: new Types.ObjectId(user.householdId),
          visibilita: 'condiviso',
        },
      ]);
    });

    it('risolve il filtro tipo → categoria tramite categoriesService.slugsByTipo', async () => {
      const { service, docModel, categoriesService } = buildService();
      categoriesService.slugsByTipo.mockResolvedValue([
        'bollo_auto',
        'revisione',
      ]);

      await service.list(user, { tipo: 'auto' });

      expect(categoriesService.slugsByTipo).toHaveBeenCalledWith('auto');
      const filter = firstCallArg(docModel.find);
      expect(filter.categoria).toEqual({ $in: ['bollo_auto', 'revisione'] });
    });

    it('categoria puntuale ha priorità sul filtro tipo', async () => {
      const { service, docModel, categoriesService } = buildService();

      await service.list(user, { categoria: 'bolletta', tipo: 'auto' });

      expect(categoriesService.slugsByTipo).not.toHaveBeenCalled();
      const filter = firstCallArg(docModel.find);
      expect(filter.categoria).toBe('bolletta');
    });
  });

  describe('findOne', () => {
    it('lancia NotFoundException se il documento non è visibile (findOne → null)', async () => {
      const { service } = buildService();

      await expect(
        service.findOne(user, new Types.ObjectId().toHexString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('lancia NotFoundException per un id non valido, senza interrogare il DB', async () => {
      const { service, docModel } = buildService();

      await expect(service.findOne(user, 'non-un-object-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(docModel.findOne).not.toHaveBeenCalled();
    });
  });

  describe('create — validazione vehicleId', () => {
    it("rifiuta un vehicleId che non appartiene all'household dell'utente", async () => {
      const { service, vehiclesService } = buildService();
      vehiclesService.belongsToHousehold.mockResolvedValue(false);

      await expect(
        service.create(
          user,
          {
            categoria: 'bollo_auto',
            titolo: 'x',
            dataDocumento: '2026-01-01',
            vehicleId: new Types.ObjectId().toHexString(),
          },
          {
            buffer: Buffer.from(''),
            mimetype: 'application/pdf',
            originalname: 'x.pdf',
          } as never,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
