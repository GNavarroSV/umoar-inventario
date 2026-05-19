# Propuesta: Carga Masiva de Activos (Implementacion Futura)

## Objetivo
Permitir cargas masivas iniciales y cargas posteriores sin duplicar activos, manteniendo trazabilidad y control de cambios.

## Principios
1. La carga masiva debe ser un proceso de integracion (no inserts directos).
2. Debe soportar modo simulacion (`DRY_RUN`) antes de escribir en base de datos.
3. Debe ser idempotente: el mismo archivo no debe duplicar activos.
4. Debe registrar auditoria por lote y por fila.

## Llave de negocio para evitar duplicados
Prioridad sugerida para identificar activo existente:
1. `externalLegacyId` (nuevo campo opcional y unico en `Asset`)
2. `code` (si existe en el archivo y es confiable)
3. `serialNumber` (cuando aplique)

Si no hay coincidencia confiable, se crea nuevo activo.
Si hay coincidencia ambigua, la fila debe marcarse como error y requerir revision manual.

## Estrategias de carga
1. `UPSERT` (recomendado): actualiza si existe, crea si no existe.
2. `INSERT_ONLY`: solo crea, rechaza registros repetidos.
3. `DRY_RUN`: valida todo y devuelve resultados sin persistir.

## Flujo recomendado (2 etapas)
### Etapa A: Recepcion
- Subir archivo CSV/XLSX.
- Parsear y guardar filas en staging con metadatos del lote.

### Etapa B: Procesamiento
Para cada fila:
1. Validar estructura y datos obligatorios.
2. Resolver relaciones (categoria, usuario responsable, centro de costo, etc.).
3. Buscar activo existente por llave de negocio.
4. Aplicar regla (`UPSERT` / `INSERT_ONLY`).
5. Guardar resultado por fila: `CREATED`, `UPDATED`, `SKIPPED`, `ERROR`.

## Campos masivos recomendados
### Obligatorios minimos
- `name`
- `category` (codigo o nombre normalizado)
- `location`
- `responsibleUser` (email o id institucional)
- `acquisitionDate`

### Opcionales
- `code`
- `serialNumber`
- `costCenter`
- `status`
- `purchaseValue`
- `currentValue`
- `supplier` (opcional, puede venir vacio)
- `invoiceNumber`
- `purchaseOrder`
- `warrantyEndDate`

## Politica de actualizacion sugerida (lista blanca)
Campos que SI pueden actualizarse en cargas posteriores:
- `location`
- `responsibleUserId`
- `costCenterId`
- `status`
- `currentValue`

Campos sensibles (actualizar solo con permiso especial o flujo aparte):
- `purchaseValue`
- `acquisitionDate`
- `code`

## Auditoria
Registrar:
1. Lote (`ImportBatch`): archivo, usuario, fecha, estrategia, resumen final.
2. Fila (`ImportBatchItem`): datos originales, resultado, error (si aplica), referencia a activo.
3. Historial de activo (`AssetHistory`): `source = BULK_IMPORT`, `changeSet` con campos modificados.

## Idempotencia
- Guardar hash del archivo y/o hash por fila.
- Si se reprocesa un archivo igual, evitar creaciones duplicadas.
- En `UPSERT`, repetir proceso debe terminar en `UPDATED`/`SKIPPED`, no en `CREATED` duplicado.

## Contrato inicial de API (propuesto)
1. `POST /imports/assets/dry-run`
2. `POST /imports/assets/execute`
3. `GET /imports/:batchId/status`
4. `GET /imports/:batchId/errors`

## Fase 1 (MVP recomendado)
1. Agregar `externalLegacyId` opcional y unico en `Asset`.
2. Crear modulo `imports` con `dry-run` y `execute` para CSV.
3. Implementar `UPSERT` con prioridad: `externalLegacyId -> code -> serialNumber`.
4. Registrar resultados por fila y resumen por lote.
5. Registrar cambios en `AssetHistory` con `source = BULK_IMPORT`.

## Riesgos y mitigaciones
1. Datos inconsistentes en archivo: usar normalizacion y validaciones previas.
2. Duplicados por llaves incompletas: exigir al menos una llave de negocio por fila.
3. Sobrescritura no deseada: aplicar lista blanca de campos actualizables.
4. Rendimiento: procesar en lotes (batch) y transacciones controladas.

## Nota final
La carga inicial y recargas posteriores son viables siempre que se implemente deteccion de identidad del activo + estrategia `UPSERT` + auditoria detallada.
