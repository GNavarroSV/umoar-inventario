'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../config/api';
import { useAuthContext } from '../../contexts/auth-context';

export type SupplierOption = {
  id: number;
  name: string;
  isActive?: boolean;
};

async function fetchSuppliers(token: string) {
  return apiRequest<SupplierOption[]>('/suppliers?isActive=true', {
    method: 'GET',
    token,
  });
}

export function useSuppliersQuery() {
  const auth = useAuthContext();

  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      if (!auth.session?.accessToken) {
        throw new Error('No autenticado');
      }

      return fetchSuppliers(auth.session.accessToken);
    },
    enabled: auth.isAuthenticated,
  });
}