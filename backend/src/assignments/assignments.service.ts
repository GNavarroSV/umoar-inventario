import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAssignmentDto,
  MarkAssignmentReturnedDto,
  UpdateAssignmentDto,
} from './dto';
import { AssignmentStatus, AssignmentType, AssetHistoryEventType } from '@prisma/client';

@Injectable()
export class AssignmentsService implements OnModuleInit, OnModuleDestroy {
  constructor(private prisma: PrismaService) {}

  private readonly expiryCheckIntervalMs = 60_000;
  private expiryTimer?: NodeJS.Timeout;

  onModuleInit() {
    this.expiryTimer = setInterval(() => {
      void this.reconcileExpiredTemporaryAssignments();
    }, this.expiryCheckIntervalMs);
  }

  onModuleDestroy() {
    if (this.expiryTimer) {
      clearInterval(this.expiryTimer);
    }
  }

  private async validateRelations(dto: {
    assetId?: number;
    assignedToPersonId?: number;
    assignedByUserId?: number;
  }) {
    if (dto.assetId) {
      const asset = await this.prisma.asset.findUnique({ where: { id: dto.assetId } });
      if (!asset) {
        throw new NotFoundException('Activo no encontrado');
      }
    }

    if (dto.assignedToPersonId) {
      const assignedTo = await this.prisma.person.findUnique({
        where: { id: dto.assignedToPersonId },
      });
      if (!assignedTo) {
        throw new NotFoundException('Persona asignada no encontrada');
      }
    }

    if (dto.assignedByUserId) {
      const assignedBy = await this.prisma.user.findUnique({
        where: { id: dto.assignedByUserId },
      });
      if (!assignedBy) {
        throw new NotFoundException('Usuario que asigna no encontrado');
      }
    }
  }

  async create(createAssignmentDto: CreateAssignmentDto) {
    await this.validateRelations(createAssignmentDto);

    const startDate = createAssignmentDto.startDate
      ? new Date(createAssignmentDto.startDate)
      : new Date();
    const dueDate = createAssignmentDto.dueDate
      ? new Date(createAssignmentDto.dueDate)
      : undefined;

    if (createAssignmentDto.type === AssignmentType.LOAN && !dueDate) {
      throw new BadRequestException('La custodia temporal requiere fecha de vencimiento');
    }

    if (dueDate && dueDate < startDate) {
      throw new BadRequestException('La fecha de vencimiento no puede ser menor a la fecha de inicio');
    }

    return this.prisma.$transaction(async (transaction: any) => {
      const asset = await transaction.asset.findUnique({
        where: { id: createAssignmentDto.assetId },
        include: {
          responsiblePerson: true,
        },
      });

      if (!asset) {
        throw new NotFoundException('Activo no encontrado');
      }

      const assignment = await transaction.assetAssignment.create({
        data: {
          assetId: createAssignmentDto.assetId,
          assignedToPersonId: createAssignmentDto.assignedToPersonId,
          assignedByUserId: createAssignmentDto.assignedByUserId,
          previousResponsiblePersonId: asset.responsiblePersonId,
          type: createAssignmentDto.type,
          status: createAssignmentDto.status ?? AssignmentStatus.ACTIVE,
          startDate,
          dueDate,
          returnDate: createAssignmentDto.returnDate
            ? new Date(createAssignmentDto.returnDate)
            : undefined,
          reason: createAssignmentDto.reason,
          notes: createAssignmentDto.notes,
        },
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
            },
          },
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
      });

      const nextResponsiblePersonId = createAssignmentDto.assignedToPersonId;

      await transaction.asset.update({
        where: { id: createAssignmentDto.assetId },
        data: {
          responsiblePersonId: nextResponsiblePersonId,
        },
      });

      await transaction.assetHistory.create({
        data: {
          assetId: createAssignmentDto.assetId,
          changedByUserId: createAssignmentDto.assignedByUserId,
          eventType:
            createAssignmentDto.type === AssignmentType.LOAN
              ? AssetHistoryEventType.LOANED
              : AssetHistoryEventType.CUSTODY_ASSIGNED,
          previousUser: asset.responsiblePerson?.name ?? null,
          newUser: assignment.assignedToPerson.name,
          changeReason: createAssignmentDto.reason ?? null,
          notes: createAssignmentDto.notes ?? null,
          source: 'assignment',
        },
      });

      return assignment;
    });
  }

  async findAll(status?: string, type?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    return this.prisma.assetAssignment.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const assignment = await this.prisma.assetAssignment.findUnique({
      where: { id },
      include: {
        asset: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
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
    });

    if (!assignment) {
      throw new NotFoundException('Asignacion no encontrada');
    }

    return assignment;
  }

  async update(id: number, updateAssignmentDto: UpdateAssignmentDto) {
    await this.findOne(id);
    await this.validateRelations(updateAssignmentDto);

    const data: any = {
      ...updateAssignmentDto,
      startDate: updateAssignmentDto.startDate
        ? new Date(updateAssignmentDto.startDate)
        : undefined,
      dueDate: updateAssignmentDto.dueDate
        ? new Date(updateAssignmentDto.dueDate)
        : undefined,
      returnDate: updateAssignmentDto.returnDate
        ? new Date(updateAssignmentDto.returnDate)
        : undefined,
    };

    if (data.dueDate && data.startDate && data.dueDate < data.startDate) {
      throw new BadRequestException('La fecha de vencimiento no puede ser menor a la fecha de inicio');
    }

    return this.prisma.assetAssignment.update({
      where: { id },
      data,
      include: {
        asset: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
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
    });
  }

  async markReturned(id: number, dto: MarkAssignmentReturnedDto) {
    const assignment = await this.findOne(id);

    if (assignment.type !== AssignmentType.LOAN) {
      throw new BadRequestException('Solo las custodia temporales pueden devolverse');
    }

    const nextReturnDate = dto.returnDate ? new Date(dto.returnDate) : new Date();

    return this.prisma.$transaction(async (transaction: any) => {
      if (assignment.previousResponsiblePersonId) {
        await transaction.asset.update({
          where: { id: assignment.assetId },
          data: {
            responsiblePersonId: assignment.previousResponsiblePersonId,
          },
        });
      }

      const updated = await transaction.assetAssignment.update({
        where: { id },
        data: {
          status: AssignmentStatus.RETURNED,
          returnDate: nextReturnDate,
          notes: dto.notes,
        },
        include: {
          asset: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
            },
          },
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
      });

      await transaction.assetHistory.create({
        data: {
          assetId: assignment.assetId,
          changedByUserId: assignment.assignedByUserId,
          eventType: AssetHistoryEventType.RETURNED,
          previousUser: assignment.assignedToPersonId.toString(),
          newUser: assignment.previousResponsiblePersonId?.toString() ?? null,
          changeReason: dto.notes ?? 'Retorno automático o manual de custodia temporal',
          notes: dto.notes ?? null,
          source: 'assignment',
        },
      });

      return updated;
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.assetAssignment.delete({ where: { id } });
  }

  private async reconcileExpiredTemporaryAssignments() {
    const expiredAssignments = await this.prisma.assetAssignment.findMany({
      where: {
        type: AssignmentType.LOAN,
        status: AssignmentStatus.ACTIVE,
        dueDate: {
          not: null,
          lte: new Date(),
        },
        previousResponsiblePersonId: {
          not: null,
        },
      },
    });

    for (const assignment of expiredAssignments) {
      await this.prisma.$transaction(async (transaction: any) => {
        if (assignment.previousResponsiblePersonId) {
          await transaction.asset.update({
            where: { id: assignment.assetId },
            data: {
              responsiblePersonId: assignment.previousResponsiblePersonId,
            },
          });
        }

        await transaction.assetAssignment.update({
          where: { id: assignment.id },
          data: {
            status: AssignmentStatus.RETURNED,
            returnDate: assignment.returnDate ?? new Date(),
            notes: assignment.notes ?? 'Reversión automática por vencimiento de custodia temporal',
          },
        });

        await transaction.assetHistory.create({
          data: {
            assetId: assignment.assetId,
            changedByUserId: assignment.assignedByUserId,
            eventType: AssetHistoryEventType.RETURNED,
            previousUser: assignment.assignedToPersonId.toString(),
            newUser: assignment.previousResponsiblePersonId?.toString() ?? null,
            changeReason: 'Reversión automática por vencimiento',
            notes: assignment.notes ?? null,
            source: 'assignment-expiry',
          },
        });
      });
    }
  }
}
