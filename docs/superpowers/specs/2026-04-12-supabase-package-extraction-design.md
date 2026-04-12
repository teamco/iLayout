# Design Spec: @iDEVconn/supabase Extraction

**Status:** Approved
**Date:** 2026-04-12
**Author:** Gemini CLI

## 1. Background & Motivation
The current Supabase integration is tightly coupled with the main application logic in `src/lib` and `src/auth`. To improve reusability and maintainability, we need to extract this logic into a standalone package `@iDEVconn/supabase`. This will allow other projects (like the `@teamco/anthill-layout-embed` package) to use the same standardized API for authentication and data fetching.

## 2. Design Specification

### 2.1. Core Client
A factory function `createSupabaseClient(url: string, key: string)` will initialize the Supabase client. This ensures the package doesn't rely on environment variables directly, making it more flexible.

### 2.2. Standardized Auth API
An `AuthService` that provides a consistent interface for:
- `login(options: LoginOptions)`: Supports magic link, email/password, and OAuth providers.
- `logout()`: Cleans up local state and signs out of Supabase.
- `getCurrentUser()`: Synchronously returns the current session/user.
- `onAuthStateChange(handler)`: Subscribes to auth events.

### 2.3. Generic Table API (CRUD Factory)
A `createTableApi<T>(tableName: string)` factory will return a standardized set of operations:
- `getAll(params?)`: With support for sorting and filtering.
- `getById(id)`: Returns a single record.
- `upsert(record)`: Handles both insert and update.
- `delete(id)`: Removes a record.

### 2.4. Error Handling Strategy
- **`SupabaseApiError`**: A custom error class extending `Error` to wrap Postgrest and Auth errors.
- **`handleError` Utility**: A centralized function to:
    - Log errors to a provided logger or console.
    - Map specific Supabase error codes (e.g., `PGRST116`) to predictable results (e.g., `null`).
    - Standardize error messages for the UI.
