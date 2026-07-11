import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { VehiclesService } from './vehicles.service';

/** Primo argomento della prima chiamata a un jest.fn(), tipizzato senza passare per `any`. */
function firstCallArg(mockFn: jest.Mock): Record<string, unknown> {
  const calls = mockFn.mock.calls as unknown[][];
  return calls[0][0] as Record<string, unknown>;
}

describe('VehiclesService — scoping per household', () => {
  const user: AuthenticatedUser = {
    userId: new Types.ObjectId().toHexString(),
    householdId: new Types.ObjectId().toHexString(),
    ruolo: 'admin',
  };

  function buildService(overrides: { findOneResult?: unknown } = {}) {
    const vehicleModel = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(overrides.findOneResult ?? null),
      }),
      exists: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    };
    const service = new VehiclesService(vehicleModel as never);
    return { service, vehicleModel };
  }

  describe('findOne / update / remove — findOwnedOrThrow', () => {
    it("lancia NotFoundException se il veicolo non appartiene all'household dell'utente", async () => {
      const { service, vehicleModel } = buildService({ findOneResult: null });

      await expect(
        service.findOne(user, new Types.ObjectId().toHexString()),
      ).rejects.toThrow(NotFoundException);
      // il filtro deve includere sempre l'household dell'utente corrente
      const filter = firstCallArg(vehicleModel.findOne);
      expect(filter.householdId).toEqual(new Types.ObjectId(user.householdId));
    });

    it('lancia NotFoundException per un id non valido, senza interrogare il DB', async () => {
      const { service, vehicleModel } = buildService();

      await expect(service.findOne(user, 'non-un-object-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(vehicleModel.findOne).not.toHaveBeenCalled();
    });
  });

  describe('belongsToHousehold', () => {
    it('ritorna false per un id non valido, senza interrogare il DB', async () => {
      const { service, vehicleModel } = buildService();

      await expect(
        service.belongsToHousehold(user.householdId, 'non-valido'),
      ).resolves.toBe(false);
      expect(vehicleModel.exists).not.toHaveBeenCalled();
    });

    it("ritorna false se il veicolo non esiste in quell'household", async () => {
      const { service } = buildService();

      await expect(
        service.belongsToHousehold(
          user.householdId,
          new Types.ObjectId().toHexString(),
        ),
      ).resolves.toBe(false);
    });
  });
});
