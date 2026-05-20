'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../config/api';
import { useAuthContext } from '../../contexts/auth-context';

export type AssignmentPersonDto = {
  id: number;
  name: string;
  email?: string | null;
  documentNumber?: string | null;
};

export type AssignmentAssetDto = {
  id: number;
  code: string;
  name: string;
  status: string;
};

export type AssignmentUserDto = {
  id: number;
  name: string;
  email: string;
};

export type AssignmentDto = {
  id: number;
  assetId: number;
  assignedToPersonId: number;
  assignedByUserId?: number | null;
  previousResponsiblePersonId?: number | null;
  type: 'CUSTODY' | 'LOAN';
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
  startDate: string;
  dueDate?: string | null;
  returnDate?: string | null;
  reason?: string | null;
  notes?: string | null;
  asset: AssignmentAssetDto;
  assignedToPerson: AssignmentPersonDto;
  previousResponsiblePerson?: AssignmentPersonDto | null;
  assignedByUser?: AssignmentUserDto | null;
};

export interface CreateAssignmentDto {
  assetId: number;
  assignedToPersonId: number;
  assignedByUserId?: number;
  type: 'CUSTODY' | 'LOAN';
  status?: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
  startDate?: string;
  dueDate?: string;
  returnDate?: string;
  reason?: string;
  notes?: string;
}

export interface UpdateAssignmentDto extends Partial<CreateAssignmentDto> {}

export interface MarkAssignmentReturnedDto {
  returnDate?: string;
  notes?: string;
}

async function fetchAssignments(token: string) {
  return apiRequest<AssignmentDto[]>('/assignments', {
    method: 'GET',
    token,
  });
}

async function createAssignment(token: string, data: CreateAssignmentDto) {
  return apiRequest<AssignmentDto>('/assignments', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

async function markReturned(token: string, id: number, data: MarkAssignmentReturnedDto) {
  return apiRequest<AssignmentDto>(`/assignments/${id}/return`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  });
}

export function useAssignmentsQuery() {
  const auth = useAuthContext();

  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return fetchAssignments(auth.session.accessToken);
    },
    enabled: auth.isAuthenticated,
  });
}

export function useCreateAssignmentMutation() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssignmentDto) => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return createAssignment(auth.session.accessToken, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assignments'] });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useMarkAssignmentReturnedMutation() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MarkAssignmentReturnedDto }) => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return markReturned(auth.session.accessToken, id, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assignments'] });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}
