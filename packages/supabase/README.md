# @idevconn/supabase

Standardized Supabase API for iLayout projects. Provides a unified interface for authentication, CRUD operations, and error handling.

## Install

```bash
npm i @idevconn/supabase
```

## Usage

### 1. Initialize Client

```typescript
import { createSupabaseClient, AuthService } from '@idevconn/supabase';

const supabase = createSupabaseClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Optional: specific supported providers for type safety
export type SupportedProvider = 'google' | 'github';

export const authService = new AuthService<SupportedProvider>(supabase, {
  allowedProviders: ['google', 'github']
});
```

### 2. Authentication

```typescript
// Login with OAuth
await authService.login({ provider: 'google' });

// Get current user/session
const { user, session } = await authService.getCurrentUser();

// Logout
await authService.logout();
```

### 3. Generic Table API (CRUD)

```typescript
import { createTableApi } from '@idevconn/supabase';

interface Profile {
  id: string;
  full_name: string;
}

const profileApi = createTableApi<Profile>(supabase, 'profiles');

// Get all with sorting
const profiles = await profileApi.getAll({
  order: { column: 'full_name', ascending: true }
});
```

---

## API Reference

### Core Functions

#### `createSupabaseClient(url: string, key: string): SupabaseClient`
Initializes and returns a standard `@supabase/supabase-js` client.
- **`url`**: Your Supabase project URL.
- **`key`**: Your Supabase anonymous/public key.

---

### Authentication Service

#### `AuthService<P extends string>(supabase: SupabaseClient, config?: AuthConfig<P>)`
A service class to manage authentication flows.
- **`login(options: LoginOptions<P>)`**: 
  - If `provider` is set: Triggers OAuth login.
  - If `email` is set (and no password): Triggers Magic Link (OTP) login.
  - If `email` and `password` are set: Triggers traditional password login.
- **`logout(onLogout?: () => void)`**: Signs the user out and executes an optional callback.
- **`getCurrentUser()`**: Returns a promise resolving to `{ user, session }`.
- **`onAuthStateChange(callback)`**: Subscribes to auth events (returns a subscription object with `.unsubscribe()`).

---

### Data Access (Table API)

#### `createTableApi<T>(supabase: SupabaseClient, tableName: string): TableApi<T>`
Factory function to create a typed CRUD interface for a specific Postgres table.

#### `TableApi<T>`
Instance created by the factory above.
- **`getAll(options?: QueryOptions)`**: Fetches multiple records. Supports `select`, `order`, `limit`, and `offset`.
- **`getById(id: string | number)`**: Fetches a single record by its primary key. Returns `null` if not found (suppresses `PGRST116`).
- **`upsert(record: Partial<T>)`**: Performs an "Insert or Update" operation.
- **`update(id: string | number, updates: Partial<T>)`**: Updates a record by ID.
- **`delete(id: string | number)`**: Deletes a record by ID.
- **`query()`**: Returns the raw Supabase `PostgrestQueryBuilder` for complex filtering or joins.

---

### Error Handling

#### `SupabaseApiError` (Class)
Custom error class extending `Error`.
- **`message`**: Readable error description.
- **`code`**: Supabase/Postgrest error code (e.g., `42P01`).
- **`status`**: HTTP status code if applicable.

#### `handleError(error: unknown): never | null`
Utility to process errors from Supabase.
- Logs errors to the console.
- Converts `PGRST116` (0 rows found) into a `null` return value.
- Wraps all other errors into a `SupabaseApiError` and throws it.

---

### Interfaces & Types

| Export | Description |
| --- | --- |
| `IUser` | Represents an authenticated user (`id`, `email`, `full_name`, `avatar_url`). |
| `ProfileRecord` | Represents a record from the `profiles` table. |
| `IEntityMeta` | Standard metadata fields (`created_at`, `created_by`, `updated_at`, `updated_by`). |
| `LoginOptions<P>` | Configuration for the login method (email, password, provider, redirectTo). |
| `AuthConfig<P>` | Configuration for `AuthService`, including `allowedProviders`. |
| `QueryOptions` | Filtering and sorting options for `getAll` (`select`, `order`, `limit`, `offset`). |

## License

[MIT](./LICENSE)
