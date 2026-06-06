import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  name: string;

  @IsString()
  label: string;

  @IsString()
  path: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  order?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  parent_id?: number;
}

export class UpdateMenuDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  icon?: string | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  order?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  parent_id?: number | null;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignMenuToRoleDto {
  @Type(() => Number)
  @IsArray()
  @IsInt({ each: true })
  menuIds: number[];
}
