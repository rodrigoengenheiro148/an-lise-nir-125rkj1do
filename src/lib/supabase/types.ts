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
    PostgrestVersion: '14.1'
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
          fco_anl: number | null
          fco_lab: number | null
          fco_nir: number | null
          id: string
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
          fco_anl?: number | null
          fco_lab?: number | null
          fco_nir?: number | null
          id?: string
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
          fco_anl?: number | null
          fco_lab?: number | null
          fco_nir?: number | null
          id?: string
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
          sub_material?: string | null
          submaterial?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'analysis_records_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
