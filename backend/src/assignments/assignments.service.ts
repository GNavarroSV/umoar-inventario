import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAssignmentDto,
  MarkAssignmentReturnedDto,
  UpdateAssignmentDto,
} from './dto';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  private async validateRelations(dto: {
    assetId?: number;
    assignedToUserId?: number;
    assignedByUserId?: number;
  }) {
    if (dto.assetId) {
      const asset = await this.prisma.asset.findUnique({ where: { id: dto.assetId } });
      if (!asset) {
        throw new NotFoundException('Activo no encontrado');
      }
    }

    if (dto.assignedToUserId) {
      const assignedTo = await this.prisma.user.findUnique({
        where: { id: dto.assignedToUserId },
      });
      if (!assignedTo) {
        throw new NotFoundException('Usuario asignado no encontrado');
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

    if (dueDate && dueDate < startDate) {
      throw new BadRequestException('La fecha de vencimiento no puede ser menor a la fecha de inicio');
    }

    return this.prisma.assetAssignment.create({
      data: {
        assetId: createAssignmentDto.assetId,
        assignedToUserId: createAssignmentDto.assignedToUserId,
        assignedByUserId: createAssignmentDto.assignedByUserId,
        type: createAssignmentDto.type,
        status: createAssignmentDto.status ?? 'ACTIVE',
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
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
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
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
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
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
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
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
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
    await this.findOne(id);

    return this.prisma.assetAssignment.update({
      where: { id },
      data: {
        status: 'RETURNED',
        returnDate: dto.returnDate ? new Date(dto.returnDate) : new Date(),
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
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
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

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.assetAssignment.delete({ where: { id } });
  }
}
