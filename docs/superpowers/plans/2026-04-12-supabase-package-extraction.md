# Implementation Plan: @iDEVconn/supabase Extraction

**Status:** Approved
**Date:** 2026-04-12
**Author:** Gemini CLI
**Spec:** `docs/superpowers/specs/2026-04-12-supabase-package-extraction-design.md`

## Implementation Plan

### Phase 1: Documentation & Setup
- [x] **Step 1.1**: Migrate this Plan and a new Design Spec to `docs/superpowers/plans/` and `docs/superpowers/specs/` respectively.
- [ ] **Step 1.2**: Create `packages/supabase/` with `package.json` and `tsconfig.json`.

### Phase 2: Package Development
- [ ] **Step 2.1**: Implement core client and types.
- [ ] **Step 2.2**: Implement `AuthService` with standard methods.
- [ ] **Step 2.3**: Implement `TableApiFactory` with generic CRUD methods.
- [ ] **Step 2.4**: Implement `handleError` and `SupabaseApiError`.

### Phase 3: Main App Integration
- [ ] **Step 3.1**: Link `@iDEVconn/supabase` to the main project.
- [ ] **Step 3.2**: Refactor `src/lib/supabase.ts` and `src/auth/AuthContext.tsx`.
- [ ] **Step 3.3**: Replace existing queries in `src/lib/queries/` with the new table API.

## 4. Verification & Rollback
- [ ] **Verification**: Run `pnpm test` in the new package and the main app. Manual verification of login and layout CRUD.
- [ ] **Rollback**: Revert `package.json` and `src/` changes if integration fails.
