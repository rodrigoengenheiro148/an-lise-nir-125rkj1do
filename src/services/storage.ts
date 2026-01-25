// Deprecated: This file is no longer used. Migrated to api.ts with Supabase.
// Kept to avoid breaking imports that haven't been migrated yet, but all should be.
import { api } from './api'

export const storageService = {
  getCompanies: async () => {
    const companies = await api.getCompanies()
    return companies.map((c) => c.name)
  },
  getRecords: async () => {
    return api.getRecords()
  },
  saveRecords: async (records: any[]) => {
    return api.saveRecords(records)
  },
  addCompany: async (name: string) => {
    await api.addCompany(name)
    return storageService.getCompanies() // Return updated list
  },
  clearData: () => {
    console.warn('Clear Data is not implemented in Cloud mode for safety.')
  },
}
