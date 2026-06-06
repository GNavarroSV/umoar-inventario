import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse } from 'csv-parse/sync';

type ImportStrategy = 'UPSERT' | 'INSERT_ONLY' | 'DRY_RUN';
type AssetStatusValue = 'OPERATIVO' | 'OBSOLETO' | 'MAL_ESTADO' | 'DESUSO' | 'REPARACION' | 'DESCARTADO';

type NormalizedImportRow = {
  externalLegacyId?: string;
  code?: string;
  serialNumber?: string;
  name?: string;
  description?: string;
  category?: string;
  quantity?: number;
  responsiblePerson?: string;
  location?: string;
  acquisitionDate?: string;
  purchaseDate?: string;
  purchaseValue?: number;
  currentValue?: number;
  costCenter?: string;
  supplier?: string;
  status?: AssetStatusValue;
  manufacturer?: string;
  model?: string;
  invoiceNumber?: string;
  purchaseOrder?: string;
  warrantyEndDate?: string;
  warrantyMonths?: number;
  notes?: string;
  [key: string]: unknown;
};

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeHeaderKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '');
  }

  private mapHeader(header: string): string {
    const key = this.normalizeHeaderKey(header);

    const aliases: Record<string, string> = {
      externallegacyid: 'externalLegacyId',
      codigolegacy: 'externalLegacyId',
      codigoexterno: 'externalLegacyId',
      codigo: 'code',
      code: 'code',
      numerodeserie: 'serialNumber',
      serialnumber: 'serialNumber',
      serie: 'serialNumber',
      nombre: 'name',
      name: 'name',
      descripcion: 'description',
      description: 'description',
      categoria: 'category',
      category: 'category',
      cantidad: 'quantity',
      quantity: 'quantity',
      responsable: 'responsiblePerson',
      personaresponsable: 'responsiblePerson',
      responsibleperson: 'responsiblePerson',
      ubicacion: 'location',
      location: 'location',
      fechaadquisicion: 'acquisitionDate',
      acquisitiondate: 'acquisitionDate',
      fechacompra: 'purchaseDate',
      purchasedate: 'purchaseDate',
      valorcompra: 'purchaseValue',
      purchasevalue: 'purchaseValue',
      valoractual: 'currentValue',
      currentvalue: 'currentValue',
      centrodecosto: 'costCenter',
      costcenter: 'costCenter',
      proveedor: 'supplier',
      supplier: 'supplier',
      estado: 'status',
      status: 'status',
      fabricante: 'manufacturer',
      manufacturer: 'manufacturer',
      modelo: 'model',
      model: 'model',
      numerofactura: 'invoiceNumber',
      invoicenumber: 'invoiceNumber',
      ordencompra: 'purchaseOrder',
      purchaseorder: 'purchaseOrder',
      fingarantia: 'warrantyEndDate',
      warrantyenddate: 'warrantyEndDate',
      mesestgarantia: 'warrantyMonths',
      warrantymonths: 'warrantyMonths',
      notas: 'notes',
      notes: 'notes',
    };

    return aliases[key] ?? header.trim();
  }

  private normalizeRow(row: Record<string, unknown>): NormalizedImportRow {
    const normalized: NormalizedImportRow = {};

    for (const [rawKey, rawValue] of Object.entries(row)) {
      const key = this.mapHeader(String(rawKey));
      const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

      if (value === '' || value === null || value === undefined) {
        continue;
      }

      switch (key) {
        case 'quantity':
        case 'purchaseValue':
        case 'currentValue':
        case 'warrantyMonths':
          normalized[key] = this.toNumber(String(value));
          break;
        case 'status':
          normalized[key] = String(value).toUpperCase() as AssetStatusValue;
          break;
        default:
          normalized[key] = String(value);
      }
    }

    return normalized;
  }

  private toNumber(value: string): number | undefined {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private parseDate(value?: string): Date | undefined {
    if (!value) return undefined;

    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const parts = trimmed.split(/[\/\-]/);
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      const [day, month, year] = parts;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? undefined : date;
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private async findCategoryId(value?: string): Promise<number | null> {
    if (!value) return null;

    const category = await this.prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: value, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    return category?.id ?? null;
  }

  private async findPersonId(value?: string): Promise<number | null> {
    if (!value) return null;

    const person = await this.prisma.person.findFirst({
      where: {
        OR: [
          { name: { equals: value, mode: 'insensitive' } },
          { email: { equals: value, mode: 'insensitive' } },
          { documentNumber: { equals: value, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    return person?.id ?? null;
  }

  private async findCostCenterId(value?: string): Promise<number | null> {
    if (!value) return null;

    const costCenter = await this.prisma.costCenter.findFirst({
      where: {
        OR: [
          { code: { equals: value, mode: 'insensitive' } },
          { name: { equals: value, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    return costCenter?.id ?? null;
  }

  private async findSupplierId(value?: string): Promise<number | null> {
    if (!value) return null;

    const supplier = await this.prisma.supplier.findFirst({
      where: {
        OR: [
          { name: { equals: value, mode: 'insensitive' } },
          { taxId: { equals: value, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    return supplier?.id ?? null;
  }

  private generateAssetCode(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ACT-${datePart}-${random}`;
  }

  private async resolveAssetByIdentifiers(row: NormalizedImportRow) {
    const filters: Array<Record<string, string>> = [];

    if (row.externalLegacyId) filters.push({ externalLegacyId: row.externalLegacyId });
    if (row.code) filters.push({ code: row.code });
    if (row.serialNumber) filters.push({ serialNumber: row.serialNumber });

    if (!filters.length) return null;

    return this.prisma.asset.findFirst({ where: { OR: filters } });
  }

  private async resolveAssetInput(row: NormalizedImportRow, mode: 'create' | 'update') {
    const categoryId = await this.findCategoryId(row.category);
    const responsiblePersonId = await this.findPersonId(row.responsiblePerson);
    const costCenterId = await this.findCostCenterId(row.costCenter);
    const supplierId = await this.findSupplierId(row.supplier);

    const shared = {
      externalLegacyId: row.externalLegacyId,
      name: row.name,
      description: row.description,
      categoryId: categoryId ?? undefined,
      quantity: row.quantity ?? undefined,
      responsiblePersonId: responsiblePersonId ?? undefined,
      location: row.location,
      acquisitionDate: this.parseDate(row.acquisitionDate),
      purchaseDate: this.parseDate(row.purchaseDate),
      purchaseValue: row.purchaseValue,
      currentValue: row.currentValue,
      costCenterId: costCenterId ?? undefined,
      supplierId: supplierId ?? undefined,
      status: row.status,
      manufacturer: row.manufacturer,
      model: row.model,
      invoiceNumber: row.invoiceNumber,
      purchaseOrder: row.purchaseOrder,
      warrantyEndDate: this.parseDate(row.warrantyEndDate),
      warrantyMonths: row.warrantyMonths,
      notes: row.notes,
    };

    if (mode === 'create') {
      const missing: string[] = [];
      if (!shared.name) missing.push('name');
      if (!shared.categoryId) missing.push('category');
      if (!shared.responsiblePersonId) missing.push('responsiblePerson');
      if (!shared.location) missing.push('location');
      if (!shared.acquisitionDate) missing.push('acquisitionDate');
      if (shared.purchaseValue === undefined) missing.push('purchaseValue');
      if (shared.currentValue === undefined) missing.push('currentValue');

      return { shared, missing };
    }

    return { shared, missing: [] as string[] };
  }

  async dryRun(file: any, strategy: ImportStrategy = 'UPSERT', notes?: string, createdByUserId?: number) {
    if (!file) throw new BadRequestException('File is required');

    const text = file.buffer.toString('utf8');
    const rawRows = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, unknown>[];
    const rows = rawRows.map((row) => this.normalizeRow(row));

    const batch = await this.prisma.importBatch.create({
      data: {
        fileName: file.originalname,
        strategy,
        status: 'PENDING',
        totalRows: rows.length,
        notes,
        createdByUserId,
      },
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const existing = await this.resolveAssetByIdentifiers(row);

      if (!existing && !row.externalLegacyId && !row.code && !row.serialNumber) {
        errors++;
        await this.prisma.importBatchItem.create({
          data: {
            batchId: batch.id,
            rowNumber: index + 1,
            externalLegacyId: row.externalLegacyId,
            rawData: row as object,
            status: 'ERROR',
            errorMessage: 'La fila necesita externalLegacyId, código o serialNumber para identificar el activo.',
          },
        });
        continue;
      }

      const isUpdate = Boolean(existing);
      const { shared, missing } = await this.resolveAssetInput(row, isUpdate ? 'update' : 'create');

      if (!isUpdate && missing.length > 0) {
        errors++;
        await this.prisma.importBatchItem.create({
          data: {
            batchId: batch.id,
            rowNumber: index + 1,
            externalLegacyId: row.externalLegacyId,
            rawData: row as object,
            status: 'ERROR',
            errorMessage: `Faltan campos requeridos: ${missing.join(', ')}`,
            changeSet: shared as object,
          },
        });
        continue;
      }

      const action = isUpdate ? 'UPDATE' : 'CREATE';
      if (isUpdate) updated += 1;
      else created += 1;

      await this.prisma.importBatchItem.create({
        data: {
          batchId: batch.id,
          rowNumber: index + 1,
          externalLegacyId: row.externalLegacyId,
          assetId: existing?.id,
          rawData: row as object,
          changeSet: shared as object,
          status: 'VALID',
          action,
        },
      });
    }

    await this.prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        processedRows: rows.length,
        createdRows: created,
        updatedRows: updated,
        skippedRows: skipped,
        errorRows: errors,
        status: 'COMPLETED',
      },
    });

    return { batchId: batch.id, total: rows.length, created, updated, skipped, errors };
  }

  async execute(batchId: number) {
    const batch = await this.prisma.importBatch.findUnique({
      where: { id: batchId },
      include: { items: true },
    });

    if (!batch) throw new BadRequestException('Batch not found');
    if (batch.status === 'PROCESSING') throw new BadRequestException('Batch already processing');

    await this.prisma.importBatch.update({ where: { id: batchId }, data: { status: 'PROCESSING' } });

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const item of batch.items) {
      try {
        const row = this.normalizeRow(item.rawData as Record<string, unknown>);
        const existing = await this.resolveAssetByIdentifiers(row);
        const { shared, missing } = await this.resolveAssetInput(row, existing ? 'update' : 'create');

        if (!existing && missing.length > 0) {
          throw new Error(`Faltan campos requeridos: ${missing.join(', ')}`);
        }

        if (!existing) {
          const asset = await this.prisma.asset.create({
            data: {
              code: this.generateAssetCode(),
              externalLegacyId: shared.externalLegacyId,
              name: shared.name ?? 'Activo importado',
              description: shared.description,
              categoryId: shared.categoryId!,
              quantity: shared.quantity ?? 1,
              responsiblePersonId: shared.responsiblePersonId!,
              location: shared.location!,
              acquisitionDate: shared.acquisitionDate!,
              purchaseDate: shared.purchaseDate,
              purchaseValue: shared.purchaseValue ?? 0,
              currentValue: shared.currentValue ?? 0,
              costCenterId: shared.costCenterId,
              supplierId: shared.supplierId,
              status: shared.status,
              manufacturer: shared.manufacturer,
              model: shared.model,
              invoiceNumber: shared.invoiceNumber,
              purchaseOrder: shared.purchaseOrder,
              warrantyEndDate: shared.warrantyEndDate,
              warrantyMonths: shared.warrantyMonths,
              notes: shared.notes,
            } as any,
          });

          await this.prisma.importBatchItem.update({
            where: { id: item.id },
            data: { status: 'CREATED', assetId: asset.id },
          });
          created += 1;
          continue;
        }

        const updateData: Record<string, unknown> = {};

        if (shared.externalLegacyId !== undefined) updateData.externalLegacyId = shared.externalLegacyId;
        if (shared.name !== undefined) updateData.name = shared.name;
        if (shared.description !== undefined) updateData.description = shared.description;
        if (shared.categoryId !== undefined) updateData.categoryId = shared.categoryId;
        if (shared.quantity !== undefined) updateData.quantity = shared.quantity;
        if (shared.responsiblePersonId !== undefined) updateData.responsiblePersonId = shared.responsiblePersonId;
        if (shared.location !== undefined) updateData.location = shared.location;
        if (shared.acquisitionDate !== undefined) updateData.acquisitionDate = shared.acquisitionDate;
        if (shared.purchaseDate !== undefined) updateData.purchaseDate = shared.purchaseDate;
        if (shared.purchaseValue !== undefined) updateData.purchaseValue = shared.purchaseValue;
        if (shared.currentValue !== undefined) updateData.currentValue = shared.currentValue;
        if (shared.costCenterId !== undefined) updateData.costCenterId = shared.costCenterId;
        if (shared.supplierId !== undefined) updateData.supplierId = shared.supplierId;
        if (shared.status !== undefined) updateData.status = shared.status;
        if (shared.manufacturer !== undefined) updateData.manufacturer = shared.manufacturer;
        if (shared.model !== undefined) updateData.model = shared.model;
        if (shared.invoiceNumber !== undefined) updateData.invoiceNumber = shared.invoiceNumber;
        if (shared.purchaseOrder !== undefined) updateData.purchaseOrder = shared.purchaseOrder;
        if (shared.warrantyEndDate !== undefined) updateData.warrantyEndDate = shared.warrantyEndDate;
        if (shared.warrantyMonths !== undefined) updateData.warrantyMonths = shared.warrantyMonths;

        await this.prisma.asset.update({
          where: { id: existing.id },
          data: updateData as any,
        });

        await this.prisma.importBatchItem.update({
          where: { id: item.id },
          data: { status: 'UPDATED', assetId: existing.id },
        });
        updated += 1;
      } catch (error) {
        failed += 1;
        await this.prisma.importBatchItem.update({
          where: { id: item.id },
          data: {
            status: 'ERROR',
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: failed > 0 ? 'FAILED' : 'COMPLETED',
        processedRows: batch.items.length,
        createdRows: created,
        updatedRows: updated,
        errorRows: failed,
        processedAt: new Date(),
      },
    });

    return { batchId, created, updated, failed };
  }

  async getBatch(batchId: number) {
    return this.prisma.importBatch.findUnique({
      where: { id: batchId },
      include: { items: true },
    });
  }
}
