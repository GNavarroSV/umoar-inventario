'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../config/api';
import { useAuthContext } from '../../contexts/auth-context';

export interface MenuChildDto {
  id: number;
  name: string;
  label: string;
  path: string;
  icon?: string | null;
  order?: number;
}

export interface MenuDto extends MenuChildDto {
  parent_id?: number | null;
  isActive?: boolean;
  children?: MenuChildDto[];
}

export interface CreateMenuDto {
  name: string;
  label: string;
  path: string;
  icon?: string;
  order?: number;
  parent_id?: number;
}

export interface UpdateMenuDto extends Partial<CreateMenuDto> {
  isActive?: boolean;
}

export interface AssignMenusToRoleDto {
  roleId: number;
  menuIds: number[];
}

async function fetchMenus(token: string) {
  return apiRequest<MenuDto[]>('/menus', {
    method: 'GET',
    token,
  });
}

async function createMenu(token: string, data: CreateMenuDto) {
  return apiRequest<MenuDto>('/menus', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  });
}

async function updateMenu(token: string, menuId: number, data: UpdateMenuDto) {
  return apiRequest<MenuDto>(`/menus/${menuId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  });
}

async function deleteMenu(token: string, menuId: number) {
  return apiRequest<MenuDto>(`/menus/${menuId}`, {
    method: 'DELETE',
    token,
  });
}

async function assignMenusToRole(token: string, data: AssignMenusToRoleDto) {
  return apiRequest(`/menus/role/${data.roleId}/assign`, {
    method: 'POST',
    token,
    body: JSON.stringify({ menuIds: data.menuIds }),
  });
}

export function useMenusQuery() {
  const auth = useAuthContext();

  return useQuery({
    queryKey: ['menus'],
    queryFn: async () => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return fetchMenus(auth.session.accessToken);
    },
    enabled: auth.isAuthenticated,
  });
}

export function useCreateMenuMutation() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMenuDto) => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return createMenu(auth.session.accessToken, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useUpdateMenuMutation() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ menuId, data }: { menuId: number; data: UpdateMenuDto }) => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return updateMenu(auth.session.accessToken, menuId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useDeleteMenuMutation() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (menuId: number) => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return deleteMenu(auth.session.accessToken, menuId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useAssignMenusToRoleMutation() {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignMenusToRoleDto) => {
      if (!auth.session?.accessToken) throw new Error('No autenticado');
      return assignMenusToRole(auth.session.accessToken, data);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
      await queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId] });
    },
  });
}