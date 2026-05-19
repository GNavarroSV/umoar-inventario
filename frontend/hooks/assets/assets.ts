'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../config/api';
import { useAuthContext } from '../../contexts/auth-context';

export interface AssetResponseDto {
  id: number;
  code: string;
  name: string;
  status: string;
  location: string;
  currentValue: number;
  acquisitionDate: string;
  responsiblePerson: {
    id: number;
    name: string;
  };
}

export interface CreateAssetDto {
  name: string;
  description?: string;
  categoryId: number;
  responsiblePersonId: number;
  location: string;
  costCenterId?: number;
  acquisitionDate: string;
  purchaseDate?: string;
  purchaseValue: number;
  currentValue: number;
  supplierId?: number;
  invoiceNumber?: string;
  purchaseOrder?: string;
  warrantyEndDate?: string;
  warrantyMonths?: number;
  depreciationType?: string;
  depreciationRate?: number;
  depreciationMonths?: number;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
}

export interface UpdateAssetDto extends Partial<CreateAssetDto> {
  status?: string;
  condition?: string;
}

export interface UpdateAssetStatusDto {
  status: string;
  reason?: string;
}

export interface AssetHistoryDto {
  id: number;
  assetId: number;
  action: string;
  date: string;
  reason?: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface AssetListParams {
  skip?: number;
  take?: number;
  status?: string;
}

export interface AssetListResponse {
  data: AssetResponseDto[];
  total: number;
}

function buildQueryString(params?: Record<string, string | number | undefined> | AssetListParams) {
  if (!params) return '';
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function fetchAssets(token: string, params?: AssetListParams) {
  return apiRequest<AssetListResponse>('/assets' + buildQueryString(params), {
    method: 'GET',
    token,
  });
}

async function fetchAssetById(token: string, id: number) {
  return apiRequest<AssetResponseDto>(`/assets/${id}`, {
    method: 'GET',
    token,
  });
}

async function fetchAssetByCode(token: string, code: string) {
  return apiRequest(`/assets/code/${code}`, {
    method: 'GET',
    token,
  });
}

async function fetchAssetHistory(token: string, id: number) {
  return apiRequest<AssetHistoryDto[]>(`/assets/history/${id}`, {
    method: 'GET',
    token,
  });
}

async function createAsset(token: string, data: CreateAssetDto) {
  return apiRequest('/assets', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

async function updateAsset(token: string, id: number, data: UpdateAssetDto) {
  return apiRequest(`/assets/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  });
}

async function updateAssetStatus(token: string, id: number, data: UpdateAssetStatusDto) {
  return apiRequest(`/assets/${id}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  });
}

async function deleteAsset(token: string, id: number) {
  return apiRequest(`/assets/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function useAssetsQuery(params?: AssetListParams) {
  const auth = useAuthContext();

  return useQuery<AssetListResponse>({
    queryKey: ['assets', params],
    queryFn: async () => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return fetchAssets(auth.session.accessToken, params);
    },
    enabled: auth.isAuthenticated,
  });
}

export function useAssetQuery(id?: number) {
  const auth = useAuthContext();

  return useQuery<AssetResponseDto>({
    queryKey: ['assets', id],
    queryFn: async () => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      if (!id) throw new Error('ID requerido');
      return fetchAssetById(auth.session.accessToken, id);
    },
    enabled: auth.isAuthenticated && Boolean(id),
  });
}

export function useAssetByCodeQuery(code?: string) {
  const auth = useAuthContext();

  return useQuery({
    queryKey: ['assets', 'code', code],
    queryFn: async () => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      if (!code) throw new Error('Código requerido');
      return fetchAssetByCode(auth.session.accessToken, code);
    },
    enabled: auth.isAuthenticated && Boolean(code),
  });
}

export function useAssetHistoryQuery(id?: number) {
  const auth = useAuthContext();

  return useQuery<AssetHistoryDto[]>({
    queryKey: ['assets', 'history', id],
    queryFn: async () => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      if (!id) throw new Error('ID requerido');
      return fetchAssetHistory(auth.session.accessToken, id);
    },
    enabled: auth.isAuthenticated && Boolean(id),
  });
}

export function useCreateAssetMutation() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssetDto) => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return createAsset(auth.session.accessToken, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useUpdateAssetMutation() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAssetDto }) => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return updateAsset(auth.session.accessToken, id, data);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      await queryClient.invalidateQueries({ queryKey: ['assets', variables.id] });
      await queryClient.invalidateQueries({ queryKey: ['assets', 'history', variables.id] });
    },
  });
}

export function useUpdateAssetStatusMutation() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateAssetStatusDto;
    }) => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return updateAssetStatus(auth.session.accessToken, id, data);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      await queryClient.invalidateQueries({ queryKey: ['assets', variables.id] });
      await queryClient.invalidateQueries({ queryKey: ['assets', 'history', variables.id] });
    },
  });
}

export function useDeleteAssetMutation() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return deleteAsset(auth.session.accessToken, id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}