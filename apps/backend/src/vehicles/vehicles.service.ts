import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { VehicleDto } from '@homedocs/shared-types';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { CreateVehicleInputDto } from './dto/create-vehicle.dto';
import { UpdateVehicleInputDto } from './dto/update-vehicle.dto';
import { Vehicle, VehicleDocument } from './vehicle.schema';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name)
    private readonly vehicleModel: Model<Vehicle>,
  ) {}

  async create(
    user: AuthenticatedUser,
    dto: CreateVehicleInputDto,
  ): Promise<VehicleDto> {
    const vehicle = await this.vehicleModel.create({
      householdId: new Types.ObjectId(user.householdId),
      targa: dto.targa,
      marca: dto.marca,
      modello: dto.modello,
      anno: dto.anno,
    });
    return this.toDto(vehicle);
  }

  async list(user: AuthenticatedUser): Promise<VehicleDto[]> {
    const vehicles = await this.vehicleModel
      .find({ householdId: new Types.ObjectId(user.householdId) })
      .sort({ createdAt: 1 })
      .exec();
    return vehicles.map((v) => this.toDto(v));
  }

  async findOne(user: AuthenticatedUser, id: string): Promise<VehicleDto> {
    return this.toDto(await this.findOwnedOrThrow(user, id));
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateVehicleInputDto,
  ): Promise<VehicleDto> {
    const vehicle = await this.findOwnedOrThrow(user, id);
    if (dto.targa !== undefined) vehicle.targa = dto.targa;
    if (dto.marca !== undefined) vehicle.marca = dto.marca;
    if (dto.modello !== undefined) vehicle.modello = dto.modello;
    if (dto.anno !== undefined) vehicle.anno = dto.anno;
    await vehicle.save();
    return this.toDto(vehicle);
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const vehicle = await this.findOwnedOrThrow(user, id);
    await vehicle.deleteOne();
  }

  /** True se il veicolo esiste e appartiene all'household dell'utente. */
  async belongsToHousehold(
    householdId: string,
    vehicleId: string,
  ): Promise<boolean> {
    if (!Types.ObjectId.isValid(vehicleId)) return false;
    return (
      (await this.vehicleModel
        .exists({
          _id: new Types.ObjectId(vehicleId),
          householdId: new Types.ObjectId(householdId),
        })
        .exec()) !== null
    );
  }

  /** I veicoli sono condivisi nell'household: nessun filtro privato/condiviso. */
  private async findOwnedOrThrow(
    user: AuthenticatedUser,
    id: string,
  ): Promise<VehicleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Veicolo non trovato');
    }
    const vehicle = await this.vehicleModel
      .findOne({
        _id: new Types.ObjectId(id),
        householdId: new Types.ObjectId(user.householdId),
      })
      .exec();
    if (!vehicle) {
      throw new NotFoundException('Veicolo non trovato');
    }
    return vehicle;
  }

  private toDto(vehicle: VehicleDocument): VehicleDto {
    return {
      id: vehicle._id.toHexString(),
      householdId: vehicle.householdId.toHexString(),
      targa: vehicle.targa,
      marca: vehicle.marca,
      modello: vehicle.modello,
      anno: vehicle.anno,
    };
  }
}
