import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  function buildService(
    overrides: {
      findByEmail?: unknown;
      findByInviteCode?: unknown;
    } = {},
  ) {
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(overrides.findByEmail ?? null),
      create: jest
        .fn()
        .mockImplementation(
          (data: { householdId: Types.ObjectId; ruolo: string }) =>
            Promise.resolve({
              _id: new Types.ObjectId(),
              householdId: data.householdId,
              ruolo: data.ruolo,
              toDto: undefined,
            }),
        ),
      setRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
      toDto: jest.fn().mockReturnValue({}),
    };
    const householdsService = {
      create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
      findByInviteCode: jest
        .fn()
        .mockResolvedValue(
          'findByInviteCode' in overrides
            ? overrides.findByInviteCode
            : { _id: new Types.ObjectId() },
        ),
    };
    const jwtService = { signAsync: jest.fn().mockResolvedValue('token') };
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
      get: jest.fn(),
    };
    const service = new AuthService(
      usersService as never,
      householdsService as never,
      jwtService as never,
      configService as never,
    );
    return { service, usersService, householdsService };
  }

  describe('register — vincolo "esattamente uno" tra nomeHousehold e codiceInvito', () => {
    it('rifiuta la registrazione se non è fornito né nomeHousehold né codiceInvito', async () => {
      const { service } = buildService();

      await expect(
        service.register({
          email: 'a@b.it',
          password: 'password123',
          nome: 'A',
          cognome: 'B',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rifiuta la registrazione se sono forniti entrambi', async () => {
      const { service } = buildService();

      await expect(
        service.register({
          email: 'a@b.it',
          password: 'password123',
          nome: 'A',
          cognome: 'B',
          nomeHousehold: 'Casa',
          codiceInvito: 'ABCD1234',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('crea un nuovo household (admin) quando è fornito solo nomeHousehold', async () => {
      const { service, usersService, householdsService } = buildService();

      await service.register({
        email: 'a@b.it',
        password: 'password123',
        nome: 'A',
        cognome: 'B',
        nomeHousehold: 'Casa Rossi',
      });

      expect(householdsService.create).toHaveBeenCalledWith('Casa Rossi');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ ruolo: 'admin' }),
      );
    });

    it('entra in un household esistente (membro) quando è fornito solo codiceInvito', async () => {
      const { service, usersService, householdsService } = buildService();

      await service.register({
        email: 'a@b.it',
        password: 'password123',
        nome: 'A',
        cognome: 'B',
        codiceInvito: 'ABCD1234',
      });

      expect(householdsService.findByInviteCode).toHaveBeenCalledWith(
        'ABCD1234',
      );
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ ruolo: 'membro' }),
      );
    });

    it('rifiuta un codiceInvito che non corrisponde a nessun household', async () => {
      const { service } = buildService({ findByInviteCode: null });

      await expect(
        service.register({
          email: 'a@b.it',
          password: 'password123',
          nome: 'A',
          cognome: 'B',
          codiceInvito: 'ZZZZZZZZ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("rifiuta la registrazione con un'email già usata", async () => {
      const { service } = buildService({
        findByEmail: { _id: new Types.ObjectId() },
      });

      await expect(
        service.register({
          email: 'a@b.it',
          password: 'password123',
          nome: 'A',
          cognome: 'B',
          nomeHousehold: 'Casa',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('rifiuta credenziali con email inesistente', async () => {
      const { service } = buildService({ findByEmail: null });

      await expect(
        service.login({ email: 'nobody@test.dev', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rifiuta credenziali con password errata', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      const { service } = buildService({
        findByEmail: {
          _id: new Types.ObjectId(),
          passwordHash,
          householdId: new Types.ObjectId(),
        },
      });

      await expect(
        service.login({ email: 'a@b.it', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
