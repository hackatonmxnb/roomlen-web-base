# API Module

Sistema reutilizable para hacer requests HTTP a APIs externas.

## Estructura

```
src/lib/api/
├── client.ts       # Cliente HTTP base reutilizable
├── roomfi.ts       # Cliente específico para RoomFi API
├── index.ts        # Exports centralizados
└── README.md       # Esta documentación
```

## Uso Básico

### 1. Usar el hook de React (Recomendado)

**Marketplace:**
```typescript
import { useMarketplace } from '@/hooks/useMarketplace';

function MyComponent() {
  const { data, isLoading, error, refetch } = useMarketplace();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data.map(listing => (
        <div key={listing.id}>{listing.property}</div>
      ))}
    </div>
  );
}
```

**Portfolio:**
```typescript
import { usePortfolio } from '@/hooks/usePortfolio';

function MyComponent() {
  const userId = '550e8400-e29b-41d4-a716-446655440002';
  const { positions, portfolioSummary, isLoading, error } = usePortfolio(userId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Total Invested: ${portfolioSummary.totalInvested}</p>
      {positions.map(position => (
        <div key={position.id}>{position.property}</div>
      ))}
    </div>
  );
}
```

### 2. Llamada directa al API

**Marketplace:**
```typescript
import { marketplaceApi } from '@/lib/api';

async function fetchMarketplace() {
  try {
    const response = await marketplaceApi.getMarketplace();
    console.log(response);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

**Portfolio:**
```typescript
import { portfolioApi } from '@/lib/api';

async function fetchPortfolio() {
  try {
    const userId = '550e8400-e29b-41d4-a716-446655440002';
    const response = await portfolioApi.getPortfolio(userId);
    console.log(response);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

**Investment:**
```typescript
import { investmentApi } from '@/lib/api';

async function investInLoan() {
  try {
    const userId = '550e8400-e29b-41d4-a716-446655440002';
    const response = await investmentApi.invest(userId, {
      loan_application_id: '4',
      investment_amount: 200000.00,
    });
    
    if (response.success) {
      console.log('Investment successful:', response);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Agregar Nuevos Endpoints

### 1. Agregar el endpoint en `roomfi.ts`

```typescript
export const lendingApi = {
  // Nuevo endpoint
  getLoanDetails: async (loanId: string) => {
    return roomfiClient.get<LoanDetailsResponse>(`/lending/loans/${loanId}`);
  },
  
  // POST request
  createLoan: async (data: CreateLoanRequest) => {
    return roomfiClient.post<CreateLoanResponse>('/lending/loans', data);
  },
};

// Definir tipos
export interface LoanDetailsResponse {
  id: string;
  amount: number;
  // ... otros campos
}

export interface CreateLoanRequest {
  propertyId: string;
  amount: number;
  // ... otros campos
}
```

### 2. Crear un hook personalizado (opcional)

```typescript
// src/hooks/useLoanDetails.ts
import { useState, useEffect } from 'react';
import { lendingApi } from '@/lib/api/roomfi';

export function useLoanDetails(loanId: string) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const loan = await lendingApi.getLoanDetails(loanId);
        setData(loan);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoan();
  }, [loanId]);

  return { data, isLoading, error };
}
```

## Agregar Nuevas APIs

Para integrar una nueva API externa:

### 1. Crear un nuevo archivo cliente

```typescript
// src/lib/api/otra-api.ts
import { ApiClient } from './client';

export const otraApiClient = new ApiClient({
  baseURL: 'https://api.ejemplo.com',
  timeout: 30000,
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN', // Si se necesita
  },
});

export const otraApi = {
  getData: async () => {
    return otraApiClient.get<ResponseType>('/endpoint');
  },
};
```

### 2. Exportar desde index.ts

```typescript
// src/lib/api/index.ts
export { otraApiClient, otraApi } from './otra-api';
export type { ResponseType } from './otra-api';
```

## Manejo de Errores

El cliente incluye `ApiError` con información detallada:

```typescript
import { ApiError } from '@/lib/api';

try {
  const data = await marketplaceApi.getMarketplace();
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Status:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Response:', error.responseBody);
  }
}
```

## Configuración

### Timeout

Por defecto es 30 segundos. Para cambiar:

```typescript
const customClient = new ApiClient({
  baseURL: 'https://api.ejemplo.com',
  timeout: 60000, // 60 segundos
});
```

### Headers personalizados

```typescript
const customClient = new ApiClient({
  baseURL: 'https://api.ejemplo.com',
  headers: {
    'X-Custom-Header': 'value',
    'Authorization': 'Bearer token',
  },
});
```

## Características

- ✅ TypeScript completo con tipos
- ✅ Manejo automático de timeouts
- ✅ Manejo de errores robusto
- ✅ Headers personalizables
- ✅ Soporte para GET, POST, PUT, DELETE, PATCH
- ✅ AbortController para cancelar requests
- ✅ Hooks de React listos para usar
