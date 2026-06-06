import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto } from './dto';
import { Asset, AssetStatus } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Genera un código único para el activo
   */
  private async generateAssetCode(): Promise<string> {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ACT-${datePart}-${random}`;
  }

  /**
   * Calcula la depreciación del activo
   */
  private calculateDepreciation(
    purchaseValue: number,
    depreciationRate: number,
    depreciationMonths: number,
  ): number {
    if (!depreciationRate || !depreciationMonths) return purchaseValue;

    const monthlyRate = depreciationRate / 100 / 12;
    const depreciatedValue =
      purchaseValue * Math.pow(1 - monthlyRate, depreciationMonths);

    return Math.max(0, depreciatedValue);
  }

  /**
   * Crear un nuevo activo
   */
  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    const code = await this.generateAssetCode();

    const asset = await this.prisma.asset.create({
      data: {
        code,
        externalLegacyId: createAssetDto.externalLegacyId,
        name: createAssetDto.name,
        description: createAssetDto.description,
        categoryId: createAssetDto.categoryId,
        quantity: createAssetDto.quantity ?? 1,
        responsiblePersonId: createAssetDto.responsiblePersonId,
        location: createAssetDto.location,
        costCenterId: createAssetDto.costCenterId,
        acquisitionDate: new Date(createAssetDto.acquisitionDate),
        purchaseDate: createAssetDto.purchaseDate
          ? new Date(createAssetDto.purchaseDate)
          : undefined,
        purchaseValue: createAssetDto.purchaseValue,
        currentValue: createAssetDto.currentValue,
        supplierId: createAssetDto.supplierId,
        invoiceNumber: createAssetDto.invoiceNumber,
        purchaseOrder: createAssetDto.purchaseOrder,
        warrantyEndDate: createAssetDto.warrantyEndDate
          ? new Date(createAssetDto.warrantyEndDate)
          : undefined,
        warrantyMonths: createAssetDto.warrantyMonths,
        depreciationType: createAssetDto.depreciationType,
        depreciationRate: createAssetDto.depreciationRate,
        depreciationMonths: createAssetDto.depreciationMonths,
        serialNumber: createAssetDto.serialNumber,
        manufacturer: createAssetDto.manufacturer,
        model: createAssetDto.model,
      },
      include: {
        category: true,
        supplier: true,
        responsiblePerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return asset;
  }

  /**
   * Obtener todos los activos
   */
  async findAll(
    skip?: number,
    take?: number,
    status?: AssetStatus,
  ): Promise<{ data: Asset[]; total: number }> {
    const where = status ? { status } : {};
    const safeSkip = Number.isFinite(skip as number) && (skip ?? 0) > 0 ? Math.floor(skip as number) : 0;
    const safeTake = Number.isFinite(take as number) && (take ?? 0) > 0 ? Math.floor(take as number) : 20;

    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        include: {
          category: true,
          responsiblePerson: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip: safeSkip,
        take: safeTake,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Obtener un activo por ID
   */
  async findOne(id: number): Promise<Asset> {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        responsiblePerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedToPerson: {
              select: {
                id: true,
                name: true,
                email: true,
                documentNumber: true,
              },
            },
            previousResponsiblePerson: {
              select: {
                id: true,
                name: true,
                email: true,
                documentNumber: true,
              },
            },
            assignedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Activo con ID ${id} no encontrado`);
    }

    return asset;
  }

  /**
   * Actualizar un activo
   */
  async update(id: number, updateAssetDto: UpdateAssetDto): Promise<Asset> {
    const asset = await this.findOne(id);

    const updateData: any = {
      ...updateAssetDto,
      warrantyEndDate: updateAssetDto.warrantyEndDate
        ? new Date(updateAssetDto.warrantyEndDate)
        : undefined,
    };

    const updated = await this.prisma.asset.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        supplier: true,
        responsiblePerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedToPerson: {
              select: {
                id: true,
                name: true,
                email: true,
                documentNumber: true,
              },
            },
            previousResponsiblePerson: {
              select: {
                id: true,
                name: true,
                email: true,
                documentNumber: true,
              },
            },
            assignedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Registrar cambios en historial
    if (updateAssetDto.status && updateAssetDto.status !== asset.status) {
      await this.prisma.assetHistory.create({
        data: {
          assetId: id,
          previousStatus: asset.status,
          newStatus: updateAssetDto.status,
          changeReason: `Estado cambió de ${asset.status} a ${updateAssetDto.status}`,
        },
      });
    }

    return updated;
  }

  /**
   * Cambiar estado de un activo
   */
  async updateStatus(
    id: number,
    newStatus: AssetStatus,
    reason?: string,
  ): Promise<Asset> {
    const asset = await this.findOne(id);

    const updated = await this.prisma.asset.update({
      where: { id },
      data: { status: newStatus },
      include: {
        category: true,
        supplier: true,
        responsiblePerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedToPerson: {
              select: {
                id: true,
                name: true,
                email: true,
                documentNumber: true,
              },
            },
            previousResponsiblePerson: {
              select: {
                id: true,
                name: true,
                email: true,
                documentNumber: true,
              },
            },
            assignedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Registrar en historial
    await this.prisma.assetHistory.create({
      data: {
        assetId: id,
        previousStatus: asset.status,
        newStatus,
        changeReason: reason,
      },
    });

    return updated;
  }

  /**
   * Buscar activos por código
   */
  async findByCode(code: string): Promise<Asset> {
    const asset = await this.prisma.asset.findUnique({
      where: { code },
      include: {
        category: true,
        supplier: true,
        responsiblePerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedToPerson: {
              select: {
                id: true,
                name: true,
                email: true,
                documentNumber: true,
              },
            },
            previousResponsiblePerson: {
              select: {
                id: true,
                name: true,
                email: true,
                documentNumber: true,
              },
            },
            assignedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Activo con código ${code} no encontrado`);
    }

    return asset;
  }

  /**
   * Eliminar un activo (cambiar estado a DESCARTADO)
   */
  async remove(id: number): Promise<Asset> {
    const asset = await this.findOne(id);

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        status: AssetStatus.DESCARTADO,
        isActive: false,
        disposalDate: new Date(),
      },
      include: {
        category: true,
        responsiblePerson: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Obtener historial de un activo
   */
  async getHistory(id: number) {
    await this.findOne(id);

    return this.prisma.assetHistory.findMany({
      where: { assetId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
