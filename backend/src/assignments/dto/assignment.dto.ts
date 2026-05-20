import { Type } from 'class-transformer';
import { AssignmentStatus, AssignmentType } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAssignmentDto {
  @Type(() => Number)
  @IsInt()
  assetId: number;

  @Type(() => Number)
  @IsInt()
  assignedToPersonId: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  assignedByUserId?: number;

  @IsEnum(AssignmentType)
  type: AssignmentType;

  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  returnDate?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAssignmentDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  assignedToPersonId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  assignedByUserId?: number;

  @IsEnum(AssignmentType)
  @IsOptional()
  type?: AssignmentType;

  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  returnDate?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class MarkAssignmentReturnedDto {
  @IsDateString()
  @IsOptional()
  returnDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
