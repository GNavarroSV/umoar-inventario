import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AssetStatus, DepreciationType } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  @IsOptional()
  externalLegacyId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  responsiblePersonId: number;

  @IsString()
  @IsNotEmpty()
  location: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  costCenterId?: number;

  @IsDateString()
  acquisitionDate: string;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchaseValue: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  currentValue: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  supplierId?: number;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsOptional()
  purchaseOrder?: string;

  @IsDateString()
  @IsOptional()
  warrantyEndDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  warrantyMonths?: number;

  @IsEnum(DepreciationType)
  @IsOptional()
  depreciationType?: DepreciationType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  depreciationRate?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  depreciationMonths?: number;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  model?: string;
}

export class UpdateAssetDto {
  @IsString()
  @IsOptional()
  externalLegacyId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  responsiblePersonId?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  costCenterId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsDateString()
  @IsOptional()
  acquisitionDate?: string;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  purchaseValue?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentValue?: number;

  @IsString()
  @IsOptional()
  supplierId?: number;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsOptional()
  purchaseOrder?: string;

  @IsDateString()
  @IsOptional()
  warrantyEndDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  warrantyMonths?: number;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsEnum(DepreciationType)
  @IsOptional()
  depreciationType?: DepreciationType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  depreciationRate?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  depreciationMonths?: number;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  model?: string;
}

export class AssetResponseDto {
  id: number;
  code: string;
  externalLegacyId?: string | null;
  name: string;
  status: AssetStatus;
  location: string;
  quantity: number;
  currentValue: number;
  acquisitionDate: Date;
  responsiblePerson: {
    id: number;
    name: string;
  };
}