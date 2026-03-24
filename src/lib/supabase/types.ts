// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analysis_records: {
        Row: {
          acidity_anl: number | null
          acidity_lab: number | null
          acidity_nir: number | null
          calcium_anl: number | null
          calcium_lab: number | null
          calcium_nir: number | null
          company_id: string
          created_at: string
          date: string | null
          ether_extract_anl: number | null
          ether_extract_lab: number | null
          ether_extract_nir: number | null
          fat_anl: number | null
          fat_lab: number | null
          fat_nir: number | null
          fco_anl: number | null
          fco_lab: number | null
          fco_nir: number | null
          id: string
          impurity_anl: number | null
          impurity_lab: number | null
          impurity_nir: number | null
          iodine_anl: number | null
          iodine_lab: number | null
          iodine_nir: number | null
          material: string | null
          mineral_matter_anl: number | null
          mineral_matter_lab: number | null
          mineral_matter_nir: number | null
          moisture_anl: number | null
          moisture_lab: number | null
          moisture_nir: number | null
          peroxide_anl: number | null
          peroxide_lab: number | null
          peroxide_nir: number | null
          phosphorus_anl: number | null
          phosphorus_lab: number | null
          phosphorus_nir: number | null
          protein_anl: number | null
          protein_digestibility_anl: number | null
          protein_digestibility_lab: number | null
          protein_digestibility_nir: number | null
          protein_lab: number | null
          protein_nir: number | null
          sodium_anl: number | null
          sodium_lab: number | null
          sodium_nir: number | null
          sub_material: string | null
          submaterial: string | null
          updated_at: string
        }
        Insert: {
          acidity_anl?: number | null
          acidity_lab?: number | null
          acidity_nir?: number | null
          calcium_anl?: number | null
          calcium_lab?: number | null
          calcium_nir?: number | null
          company_id: string
          created_at?: string
          date?: string | null
          ether_extract_anl?: number | null
          ether_extract_lab?: number | null
          ether_extract_nir?: number | null
          fat_anl?: number | null
          fat_lab?: number | null
          fat_nir?: number | null
          fco_anl?: number | null
          fco_lab?: number | null
          fco_nir?: number | null
          id?: string
          impurity_anl?: number | null
          impurity_lab?: number | null
          impurity_nir?: number | null
          iodine_anl?: number | null
          iodine_lab?: number | null
          iodine_nir?: number | null
          material?: string | null
          mineral_matter_anl?: number | null
          mineral_matter_lab?: number | null
          mineral_matter_nir?: number | null
          moisture_anl?: number | null
          moisture_lab?: number | null
          moisture_nir?: number | null
          peroxide_anl?: number | null
          peroxide_lab?: number | null
          peroxide_nir?: number | null
          phosphorus_anl?: number | null
          phosphorus_lab?: number | null
          phosphorus_nir?: number | null
          protein_anl?: number | null
          protein_digestibility_anl?: number | null
          protein_digestibility_lab?: number | null
          protein_digestibility_nir?: number | null
          protein_lab?: number | null
          protein_nir?: number | null
          sodium_anl?: number | null
          sodium_lab?: number | null
          sodium_nir?: number | null
          sub_material?: string | null
          submaterial?: string | null
          updated_at?: string
        }
        Update: {
          acidity_anl?: number | null
          acidity_lab?: number | null
          acidity_nir?: number | null
          calcium_anl?: number | null
          calcium_lab?: number | null
          calcium_nir?: number | null
          company_id?: string
          created_at?: string
          date?: string | null
          ether_extract_anl?: number | null
          ether_extract_lab?: number | null
          ether_extract_nir?: number | null
          fat_anl?: number | null
          fat_lab?: number | null
          fat_nir?: number | null
          fco_anl?: number | null
          fco_lab?: number | null
          fco_nir?: number | null
          id?: string
          impurity_anl?: number | null
          impurity_lab?: number | null
          impurity_nir?: number | null
          iodine_anl?: number | null
          iodine_lab?: number | null
          iodine_nir?: number | null
          material?: string | null
          mineral_matter_anl?: number | null
          mineral_matter_lab?: number | null
          mineral_matter_nir?: number | null
          moisture_anl?: number | null
          moisture_lab?: number | null
          moisture_nir?: number | null
          peroxide_anl?: number | null
          peroxide_lab?: number | null
          peroxide_nir?: number | null
          phosphorus_anl?: number | null
          phosphorus_lab?: number | null
          phosphorus_nir?: number | null
          protein_anl?: number | null
          protein_digestibility_anl?: number | null
          protein_digestibility_lab?: number | null
          protein_digestibility_nir?: number | null
          protein_lab?: number | null
          protein_nir?: number | null
          sodium_anl?: number | null
          sodium_lab?: number | null
          sodium_nir?: number | null
          sub_material?: string | null
          submaterial?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_upsert_analysis_records: {
        Args: { records: Json }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const


// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: analysis_records
//   id: uuid (not null, default: gen_random_uuid())
//   company_id: uuid (not null)
//   date: date (nullable)
//   created_at: timestamp with time zone (not null, default: timezone('utc'::text, now()))
//   updated_at: timestamp with time zone (not null, default: timezone('utc'::text, now()))
//   acidity_lab: double precision (nullable, default: 0)
//   acidity_nir: double precision (nullable, default: 0)
//   moisture_lab: double precision (nullable, default: 0)
//   moisture_nir: double precision (nullable, default: 0)
//   fco_lab: double precision (nullable, default: 0)
//   fco_nir: double precision (nullable, default: 0)
//   protein_lab: double precision (nullable, default: 0)
//   protein_nir: double precision (nullable, default: 0)
//   phosphorus_lab: double precision (nullable, default: 0)
//   phosphorus_nir: double precision (nullable, default: 0)
//   mineral_matter_lab: double precision (nullable, default: 0)
//   mineral_matter_nir: double precision (nullable, default: 0)
//   peroxide_lab: double precision (nullable, default: 0)
//   peroxide_nir: double precision (nullable, default: 0)
//   ether_extract_lab: double precision (nullable, default: 0)
//   ether_extract_nir: double precision (nullable, default: 0)
//   protein_digestibility_lab: double precision (nullable, default: 0)
//   protein_digestibility_nir: double precision (nullable, default: 0)
//   calcium_lab: double precision (nullable, default: 0)
//   calcium_nir: double precision (nullable, default: 0)
//   material: text (nullable)
//   acidity_anl: numeric (nullable)
//   moisture_anl: numeric (nullable)
//   fco_anl: numeric (nullable)
//   protein_anl: numeric (nullable)
//   phosphorus_anl: numeric (nullable)
//   mineral_matter_anl: numeric (nullable)
//   peroxide_anl: numeric (nullable)
//   ether_extract_anl: numeric (nullable)
//   protein_digestibility_anl: numeric (nullable)
//   calcium_anl: numeric (nullable)
//   submaterial: text (nullable)
//   sub_material: text (nullable)
//   sodium_lab: numeric (nullable)
//   sodium_nir: numeric (nullable)
//   sodium_anl: numeric (nullable)
//   iodine_lab: numeric (nullable)
//   iodine_nir: numeric (nullable)
//   iodine_anl: numeric (nullable)
//   impurity_lab: numeric (nullable)
//   impurity_nir: numeric (nullable)
//   impurity_anl: numeric (nullable)
//   fat_lab: double precision (nullable, default: 0)
//   fat_nir: double precision (nullable, default: 0)
//   fat_anl: numeric (nullable)
// Table: companies
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   logo_url: text (nullable)
//   created_at: timestamp with time zone (not null, default: timezone('utc'::text, now()))
//   owner_id: uuid (nullable)

// --- CONSTRAINTS ---
// Table: analysis_records
//   FOREIGN KEY analysis_records_company_id_fkey: FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
//   PRIMARY KEY analysis_records_pkey: PRIMARY KEY (id)
// Table: companies
//   UNIQUE companies_name_key: UNIQUE (name)
//   FOREIGN KEY companies_owner_id_fkey: FOREIGN KEY (owner_id) REFERENCES auth.users(id)
//   PRIMARY KEY companies_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: analysis_records
//   Policy "Allow authenticated delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Allow authenticated insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Allow authenticated select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Allow authenticated update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow public read access on analysis_records" (SELECT, PERMISSIVE) roles={public}
//     USING: true
//   Policy "Users can delete records of their companies" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (company_id IN ( SELECT companies.id    FROM companies   WHERE (companies.owner_id = auth.uid())))
//   Policy "Users can insert records to their companies" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (company_id IN ( SELECT companies.id    FROM companies   WHERE (companies.owner_id = auth.uid())))
//   Policy "Users can select records of their companies" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (company_id IN ( SELECT companies.id    FROM companies   WHERE (companies.owner_id = auth.uid())))
//   Policy "Users can update records of their companies" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (company_id IN ( SELECT companies.id    FROM companies   WHERE (companies.owner_id = auth.uid())))
// Table: companies
//   Policy "Allow public read access on companies" (SELECT, PERMISSIVE) roles={public}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Users can delete their own companies" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (owner_id = auth.uid())
//   Policy "Users can insert their own companies" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (owner_id = auth.uid())
//   Policy "Users can select their own companies" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (owner_id = auth.uid())
//   Policy "Users can update their own companies" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (owner_id = auth.uid())

// --- DATABASE FUNCTIONS ---
// FUNCTION bulk_upsert_analysis_records(jsonb)
//   CREATE OR REPLACE FUNCTION public.bulk_upsert_analysis_records(records jsonb)
//    RETURNS void
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//       record JSONB;
//       rec_id UUID;
//       rec_company_id UUID;
//       rec_date DATE;
//       rec_material TEXT;
//       rec_submaterial TEXT;
//   BEGIN
//       FOR record IN SELECT * FROM jsonb_array_elements(records)
//       LOOP
//           rec_id := (record->>'id')::UUID;
//           rec_company_id := (record->>'company_id')::UUID;
//           rec_date := (record->>'date')::DATE;
//           rec_material := record->>'material';
//           
//           -- Handle both possible keys for submaterial from JSON and normalize
//           rec_submaterial := record->>'sub_material';
//           IF rec_submaterial IS NULL THEN
//               rec_submaterial := record->>'submaterial';
//           END IF;
//           
//           IF rec_id IS NOT NULL THEN
//               INSERT INTO analysis_records (
//                   id, company_id, date, material, sub_material, submaterial, created_at, updated_at,
//                   acidity_lab, acidity_nir, acidity_anl,
//                   moisture_lab, moisture_nir, moisture_anl,
//                   fco_lab, fco_nir, fco_anl,
//                   protein_lab, protein_nir, protein_anl,
//                   phosphorus_lab, phosphorus_nir, phosphorus_anl,
//                   mineral_matter_lab, mineral_matter_nir, mineral_matter_anl,
//                   peroxide_lab, peroxide_nir, peroxide_anl,
//                   ether_extract_lab, ether_extract_nir, ether_extract_anl,
//                   protein_digestibility_lab, protein_digestibility_nir, protein_digestibility_anl,
//                   calcium_lab, calcium_nir, calcium_anl,
//                   sodium_lab, sodium_nir, sodium_anl,
//                   iodine_lab, iodine_nir, iodine_anl,
//                   impurity_lab, impurity_nir, impurity_anl,
//                   fat_lab, fat_nir, fat_anl
//               ) VALUES (
//                   rec_id, rec_company_id, rec_date, rec_material, rec_submaterial, rec_submaterial, NOW(), NOW(),
//                   (record->>'acidity_lab')::NUMERIC, (record->>'acidity_nir')::NUMERIC, (record->>'acidity_anl')::NUMERIC,
//                   (record->>'moisture_lab')::NUMERIC, (record->>'moisture_nir')::NUMERIC, (record->>'moisture_anl')::NUMERIC,
//                   (record->>'fco_lab')::NUMERIC, (record->>'fco_nir')::NUMERIC, (record->>'fco_anl')::NUMERIC,
//                   (record->>'protein_lab')::NUMERIC, (record->>'protein_nir')::NUMERIC, (record->>'protein_anl')::NUMERIC,
//                   (record->>'phosphorus_lab')::NUMERIC, (record->>'phosphorus_nir')::NUMERIC, (record->>'phosphorus_anl')::NUMERIC,
//                   (record->>'mineral_matter_lab')::NUMERIC, (record->>'mineral_matter_nir')::NUMERIC, (record->>'mineral_matter_anl')::NUMERIC,
//                   (record->>'peroxide_lab')::NUMERIC, (record->>'peroxide_nir')::NUMERIC, (record->>'peroxide_anl')::NUMERIC,
//                   (record->>'ether_extract_lab')::NUMERIC, (record->>'ether_extract_nir')::NUMERIC, (record->>'ether_extract_anl')::NUMERIC,
//                   (record->>'protein_digestibility_lab')::NUMERIC, (record->>'protein_digestibility_nir')::NUMERIC, (record->>'protein_digestibility_anl')::NUMERIC,
//                   (record->>'calcium_lab')::NUMERIC, (record->>'calcium_nir')::NUMERIC, (record->>'calcium_anl')::NUMERIC,
//                   (record->>'sodium_lab')::NUMERIC, (record->>'sodium_nir')::NUMERIC, (record->>'sodium_anl')::NUMERIC,
//                   (record->>'iodine_lab')::NUMERIC, (record->>'iodine_nir')::NUMERIC, (record->>'iodine_anl')::NUMERIC,
//                   (record->>'impurity_lab')::NUMERIC, (record->>'impurity_nir')::NUMERIC, (record->>'impurity_anl')::NUMERIC,
//                   (record->>'fat_lab')::NUMERIC, (record->>'fat_nir')::NUMERIC, (record->>'fat_anl')::NUMERIC
//               )
//               ON CONFLICT (id) DO UPDATE
//               SET
//                   company_id = EXCLUDED.company_id,
//                   date = EXCLUDED.date,
//                   material = EXCLUDED.material,
//                   sub_material = EXCLUDED.sub_material,
//                   submaterial = EXCLUDED.submaterial,
//                   updated_at = NOW(),
//                   
//                   acidity_lab = COALESCE(EXCLUDED.acidity_lab, analysis_records.acidity_lab),
//                   acidity_nir = COALESCE(EXCLUDED.acidity_nir, analysis_records.acidity_nir),
//                   acidity_anl = COALESCE(EXCLUDED.acidity_anl, analysis_records.acidity_anl),
//                   
//                   moisture_lab = COALESCE(EXCLUDED.moisture_lab, analysis_records.moisture_lab),
//                   moisture_nir = COALESCE(EXCLUDED.moisture_nir, analysis_records.moisture_nir),
//                   moisture_anl = COALESCE(EXCLUDED.moisture_anl, analysis_records.moisture_anl),
//                   
//                   fco_lab = COALESCE(EXCLUDED.fco_lab, analysis_records.fco_lab),
//                   fco_nir = COALESCE(EXCLUDED.fco_nir, analysis_records.fco_nir),
//                   fco_anl = COALESCE(EXCLUDED.fco_anl, analysis_records.fco_anl),
//                   
//                   protein_lab = COALESCE(EXCLUDED.protein_lab, analysis_records.protein_lab),
//                   protein_nir = COALESCE(EXCLUDED.protein_nir, analysis_records.protein_nir),
//                   protein_anl = COALESCE(EXCLUDED.protein_anl, analysis_records.protein_anl),
//                   
//                   phosphorus_lab = COALESCE(EXCLUDED.phosphorus_lab, analysis_records.phosphorus_lab),
//                   phosphorus_nir = COALESCE(EXCLUDED.phosphorus_nir, analysis_records.phosphorus_nir),
//                   phosphorus_anl = COALESCE(EXCLUDED.phosphorus_anl, analysis_records.phosphorus_anl),
//                   
//                   mineral_matter_lab = COALESCE(EXCLUDED.mineral_matter_lab, analysis_records.mineral_matter_lab),
//                   mineral_matter_nir = COALESCE(EXCLUDED.mineral_matter_nir, analysis_records.mineral_matter_nir),
//                   mineral_matter_anl = COALESCE(EXCLUDED.mineral_matter_anl, analysis_records.mineral_matter_anl),
//                   
//                   peroxide_lab = COALESCE(EXCLUDED.peroxide_lab, analysis_records.peroxide_lab),
//                   peroxide_nir = COALESCE(EXCLUDED.peroxide_nir, analysis_records.peroxide_nir),
//                   peroxide_anl = COALESCE(EXCLUDED.peroxide_anl, analysis_records.peroxide_anl),
//                   
//                   ether_extract_lab = COALESCE(EXCLUDED.ether_extract_lab, analysis_records.ether_extract_lab),
//                   ether_extract_nir = COALESCE(EXCLUDED.ether_extract_nir, analysis_records.ether_extract_nir),
//                   ether_extract_anl = COALESCE(EXCLUDED.ether_extract_anl, analysis_records.ether_extract_anl),
//                   
//                   protein_digestibility_lab = COALESCE(EXCLUDED.protein_digestibility_lab, analysis_records.protein_digestibility_lab),
//                   protein_digestibility_nir = COALESCE(EXCLUDED.protein_digestibility_nir, analysis_records.protein_digestibility_nir),
//                   protein_digestibility_anl = COALESCE(EXCLUDED.protein_digestibility_anl, analysis_records.protein_digestibility_anl),
//                   
//                   calcium_lab = COALESCE(EXCLUDED.calcium_lab, analysis_records.calcium_lab),
//                   calcium_nir = COALESCE(EXCLUDED.calcium_nir, analysis_records.calcium_nir),
//                   calcium_anl = COALESCE(EXCLUDED.calcium_anl, analysis_records.calcium_anl),
//                   
//                   sodium_lab = COALESCE(EXCLUDED.sodium_lab, analysis_records.sodium_lab),
//                   sodium_nir = COALESCE(EXCLUDED.sodium_nir, analysis_records.sodium_nir),
//                   sodium_anl = COALESCE(EXCLUDED.sodium_anl, analysis_records.sodium_anl),
//                   
//                   iodine_lab = COALESCE(EXCLUDED.iodine_lab, analysis_records.iodine_lab),
//                   iodine_nir = COALESCE(EXCLUDED.iodine_nir, analysis_records.iodine_nir),
//                   iodine_anl = COALESCE(EXCLUDED.iodine_anl, analysis_records.iodine_anl),
//                   
//                   impurity_lab = COALESCE(EXCLUDED.impurity_lab, analysis_records.impurity_lab),
//                   impurity_nir = COALESCE(EXCLUDED.impurity_nir, analysis_records.impurity_nir),
//                   impurity_anl = COALESCE(EXCLUDED.impurity_anl, analysis_records.impurity_anl),
//                   
//                   fat_lab = COALESCE(EXCLUDED.fat_lab, analysis_records.fat_lab),
//                   fat_nir = COALESCE(EXCLUDED.fat_nir, analysis_records.fat_nir),
//                   fat_anl = COALESCE(EXCLUDED.fat_anl, analysis_records.fat_anl);
//           ELSE
//               -- No ID provided, force INSERT
//                INSERT INTO analysis_records (
//                   company_id, date, material, sub_material, submaterial, created_at, updated_at,
//                   acidity_lab, acidity_nir, acidity_anl,
//                   moisture_lab, moisture_nir, moisture_anl,
//                   fco_lab, fco_nir, fco_anl,
//                   protein_lab, protein_nir, protein_anl,
//                   phosphorus_lab, phosphorus_nir, phosphorus_anl,
//                   mineral_matter_lab, mineral_matter_nir, mineral_matter_anl,
//                   peroxide_lab, peroxide_nir, peroxide_anl,
//                   ether_extract_lab, ether_extract_nir, ether_extract_anl,
//                   protein_digestibility_lab, protein_digestibility_nir, protein_digestibility_anl,
//                   calcium_lab, calcium_nir, calcium_anl,
//                   sodium_lab, sodium_nir, sodium_anl,
//                   iodine_lab, iodine_nir, iodine_anl,
//                   impurity_lab, impurity_nir, impurity_anl,
//                   fat_lab, fat_nir, fat_anl
//               ) VALUES (
//                   rec_company_id, rec_date, rec_material, rec_submaterial, rec_submaterial, NOW(), NOW(),
//                   (record->>'acidity_lab')::NUMERIC, (record->>'acidity_nir')::NUMERIC, (record->>'acidity_anl')::NUMERIC,
//                   (record->>'moisture_lab')::NUMERIC, (record->>'moisture_nir')::NUMERIC, (record->>'moisture_anl')::NUMERIC,
//                   (record->>'fco_lab')::NUMERIC, (record->>'fco_nir')::NUMERIC, (record->>'fco_anl')::NUMERIC,
//                   (record->>'protein_lab')::NUMERIC, (record->>'protein_nir')::NUMERIC, (record->>'protein_anl')::NUMERIC,
//                   (record->>'phosphorus_lab')::NUMERIC, (record->>'phosphorus_nir')::NUMERIC, (record->>'phosphorus_anl')::NUMERIC,
//                   (record->>'mineral_matter_lab')::NUMERIC, (record->>'mineral_matter_nir')::NUMERIC, (record->>'mineral_matter_anl')::NUMERIC,
//                   (record->>'peroxide_lab')::NUMERIC, (record->>'peroxide_nir')::NUMERIC, (record->>'peroxide_anl')::NUMERIC,
//                   (record->>'ether_extract_lab')::NUMERIC, (record->>'ether_extract_nir')::NUMERIC, (record->>'ether_extract_anl')::NUMERIC,
//                   (record->>'protein_digestibility_lab')::NUMERIC, (record->>'protein_digestibility_nir')::NUMERIC, (record->>'protein_digestibility_anl')::NUMERIC,
//                   (record->>'calcium_lab')::NUMERIC, (record->>'calcium_nir')::NUMERIC, (record->>'calcium_anl')::NUMERIC,
//                   (record->>'sodium_lab')::NUMERIC, (record->>'sodium_nir')::NUMERIC, (record->>'sodium_anl')::NUMERIC,
//                   (record->>'iodine_lab')::NUMERIC, (record->>'iodine_nir')::NUMERIC, (record->>'iodine_anl')::NUMERIC,
//                   (record->>'impurity_lab')::NUMERIC, (record->>'impurity_nir')::NUMERIC, (record->>'impurity_anl')::NUMERIC,
//                   (record->>'fat_lab')::NUMERIC, (record->>'fat_nir')::NUMERIC, (record->>'fat_anl')::NUMERIC
//               );
//           END IF;
//       END LOOP;
//   END;
//   $function$
//   
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.companies (name, owner_id)
//     VALUES (
//       COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'), 
//       NEW.id
//     );
//     RETURN NEW;
//   END;
//   $function$
//   

// --- INDEXES ---
// Table: analysis_records
//   CREATE INDEX idx_analysis_records_company_id ON public.analysis_records USING btree (company_id)
//   CREATE INDEX idx_analysis_records_date ON public.analysis_records USING btree (date)
// Table: companies
//   CREATE UNIQUE INDEX companies_name_key ON public.companies USING btree (name)

