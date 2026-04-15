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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      artista_disponibilidad: {
        Row: {
          artista_id: string | null
          created_at: string | null
          disponible: boolean | null
          fecha: string
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          motivo: string | null
          notas: string | null
          updated_at: string | null
        }
        Insert: {
          artista_id?: string | null
          created_at?: string | null
          disponible?: boolean | null
          fecha: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          notas?: string | null
          updated_at?: string | null
        }
        Update: {
          artista_id?: string | null
          created_at?: string | null
          disponible?: boolean | null
          fecha?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          motivo?: string | null
          notas?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artista_disponibilidad_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "artistas"
            referencedColumns: ["id"]
          },
        ]
      }
      artista_disponibilidad_premium: {
        Row: {
          artista_id: string
          cache_especial: number | null
          ciudad: string
          created_at: string | null
          disponible: boolean | null
          fecha: string
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          notas: string | null
          pais: string | null
          updated_at: string | null
        }
        Insert: {
          artista_id: string
          cache_especial?: number | null
          ciudad: string
          created_at?: string | null
          disponible?: boolean | null
          fecha: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          notas?: string | null
          pais?: string | null
          updated_at?: string | null
        }
        Update: {
          artista_id?: string
          cache_especial?: number | null
          ciudad?: string
          created_at?: string | null
          disponible?: boolean | null
          fecha?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          notas?: string | null
          pais?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artista_disponibilidad_premium_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "artistas"
            referencedColumns: ["id"]
          },
        ]
      }
      artista_disponibilidad_semanal: {
        Row: {
          activo: boolean | null
          artista_id: string | null
          created_at: string | null
          dia_semana: string
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          artista_id?: string | null
          created_at?: string | null
          dia_semana: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          artista_id?: string | null
          created_at?: string | null
          dia_semana?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artista_disponibilidad_semanal_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "artistas"
            referencedColumns: ["id"]
          },
        ]
      }
      artistas: {
        Row: {
          cache: number | null
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          email: string | null
          estilo: string | null
          foto_url: string | null
          id: string
          nombre: string
          perfil_artista_id: string | null
          representante_id: string | null
          tipos_evento: string[] | null
        }
        Insert: {
          cache?: number | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          email?: string | null
          estilo?: string | null
          foto_url?: string | null
          id?: string
          nombre: string
          perfil_artista_id?: string | null
          representante_id?: string | null
          tipos_evento?: string[] | null
        }
        Update: {
          cache?: number | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          email?: string | null
          estilo?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          perfil_artista_id?: string | null
          representante_id?: string | null
          tipos_evento?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "artistas_perfil_artista_id_fkey"
            columns: ["perfil_artista_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artistas_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contrataciones: {
        Row: {
          artista_id: string | null
          asistencia_estimada: number | null
          cache_pagado: number | null
          created_at: string | null
          evento_id: string | null
          fecha: string | null
          id: string
          negocio_id: string | null
          notas: string | null
          satisfaccion: number | null
        }
        Insert: {
          artista_id?: string | null
          asistencia_estimada?: number | null
          cache_pagado?: number | null
          created_at?: string | null
          evento_id?: string | null
          fecha?: string | null
          id?: string
          negocio_id?: string | null
          notas?: string | null
          satisfaccion?: number | null
        }
        Update: {
          artista_id?: string | null
          asistencia_estimada?: number | null
          cache_pagado?: number | null
          created_at?: string | null
          evento_id?: string | null
          fecha?: string | null
          id?: string
          negocio_id?: string | null
          notas?: string | null
          satisfaccion?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contrataciones_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "artistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrataciones_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrataciones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      espacio_disponibilidad: {
        Row: {
          created_at: string
          disponible: boolean | null
          espacio_id: string
          fecha: string
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          notas: string | null
          tarifa_especial: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          disponible?: boolean | null
          espacio_id: string
          fecha: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          notas?: string | null
          tarifa_especial?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          disponible?: boolean | null
          espacio_id?: string
          fecha?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          notas?: string | null
          tarifa_especial?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "espacio_disponibilidad_espacio_id_fkey"
            columns: ["espacio_id"]
            isOneToOne: false
            referencedRelation: "espacios"
            referencedColumns: ["id"]
          },
        ]
      }
      espacios: {
        Row: {
          capacidad_maxima: number | null
          ciudad: string | null
          condiciones_alquiler: string | null
          created_at: string
          descripcion: string | null
          direccion: string | null
          equipamiento_adicional: string | null
          fotos_urls: string[] | null
          id: string
          moneda: string | null
          nombre: string
          tarifa_base: number | null
          tarifa_por_hora: number | null
          tiene_backline: boolean | null
          tiene_camerinos: boolean | null
          tiene_iluminacion: boolean | null
          tiene_sonido: boolean | null
          tipo: string
          ubicacion: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          capacidad_maxima?: number | null
          ciudad?: string | null
          condiciones_alquiler?: string | null
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          equipamiento_adicional?: string | null
          fotos_urls?: string[] | null
          id?: string
          moneda?: string | null
          nombre: string
          tarifa_base?: number | null
          tarifa_por_hora?: number | null
          tiene_backline?: boolean | null
          tiene_camerinos?: boolean | null
          tiene_iluminacion?: boolean | null
          tiene_sonido?: boolean | null
          tipo: string
          ubicacion?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          capacidad_maxima?: number | null
          ciudad?: string | null
          condiciones_alquiler?: string | null
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          equipamiento_adicional?: string | null
          fotos_urls?: string[] | null
          id?: string
          moneda?: string | null
          nombre?: string
          tarifa_base?: number | null
          tarifa_por_hora?: number | null
          tiene_backline?: boolean | null
          tiene_camerinos?: boolean | null
          tiene_iluminacion?: boolean | null
          tiene_sonido?: boolean | null
          tipo?: string
          ubicacion?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          artista_confirmado: boolean | null
          artista_id: string | null
          created_at: string | null
          duracion: number | null
          factura_url: string | null
          fecha: string | null
          hora_inicio: string | null
          id: string
          notas: string | null
          pago_realizado: boolean | null
          updated_at: string | null
        }
        Insert: {
          artista_confirmado?: boolean | null
          artista_id?: string | null
          created_at?: string | null
          duracion?: number | null
          factura_url?: string | null
          fecha?: string | null
          hora_inicio?: string | null
          id?: string
          notas?: string | null
          pago_realizado?: boolean | null
          updated_at?: string | null
        }
        Update: {
          artista_confirmado?: boolean | null
          artista_id?: string | null
          created_at?: string | null
          duracion?: number | null
          factura_url?: string | null
          fecha?: string | null
          hora_inicio?: string | null
          id?: string
          notas?: string | null
          pago_realizado?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "artistas"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios: {
        Row: {
          capacidad: number | null
          created_at: string | null
          descripcion: string | null
          dias_apertura: string[] | null
          estilos_musicales: string[] | null
          hora_apertura: string | null
          hora_cierre: string | null
          id: string
          nombre: string
          presupuesto_max: number | null
          presupuesto_min: number | null
          tipo: string | null
          ubicacion: string | null
          updated_at: string | null
        }
        Insert: {
          capacidad?: number | null
          created_at?: string | null
          descripcion?: string | null
          dias_apertura?: string[] | null
          estilos_musicales?: string[] | null
          hora_apertura?: string | null
          hora_cierre?: string | null
          id?: string
          nombre: string
          presupuesto_max?: number | null
          presupuesto_min?: number | null
          tipo?: string | null
          ubicacion?: string | null
          updated_at?: string | null
        }
        Update: {
          capacidad?: number | null
          created_at?: string | null
          descripcion?: string | null
          dias_apertura?: string[] | null
          estilos_musicales?: string[] | null
          hora_apertura?: string | null
          hora_cierre?: string | null
          id?: string
          nombre?: string
          presupuesto_max?: number | null
          presupuesto_min?: number | null
          tipo?: string | null
          ubicacion?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          artista_id: string | null
          created_at: string | null
          evento_id: string | null
          id: string
          leida: boolean | null
          mensaje: string | null
          tipo: string | null
          titulo: string | null
        }
        Insert: {
          artista_id?: string | null
          created_at?: string | null
          evento_id?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string | null
          tipo?: string | null
          titulo?: string | null
        }
        Update: {
          artista_id?: string | null
          created_at?: string | null
          evento_id?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string | null
          tipo?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "artistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nombre: string
          telefono: string | null
          tipo_usuario: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          tipo_usuario?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          tipo_usuario?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          foto_url: string | null
          id: string
          nombre: string
          subtipo_venue: Database["public"]["Enums"]["venue_subtype"] | null
          telefono: string | null
          tipo_usuario: Database["public"]["Enums"]["user_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nombre: string
          subtipo_venue?: Database["public"]["Enums"]["venue_subtype"] | null
          telefono?: string | null
          tipo_usuario: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          subtipo_venue?: Database["public"]["Enums"]["venue_subtype"] | null
          telefono?: string | null
          tipo_usuario?: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
          user_id?: string
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
      user_type: "venue" | "artista" | "representante"
      venue_subtype: "contratante" | "espacio" | "ambos"
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
    Enums: {
      user_type: ["venue", "artista", "representante"],
      venue_subtype: ["contratante", "espacio", "ambos"],
    },
  },
} as const
