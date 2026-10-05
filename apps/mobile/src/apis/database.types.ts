
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "categories": {
                  Row: {
                    "archived": boolean,"color_token": string,"icon": string,"id": string,"name": string,"sort_order": number,"user_id": string
                  }
                  Insert: {
                    "archived"?: boolean,"color_token": string,"icon": string,"id"?: string,"name": string,"sort_order"?: number,"user_id"?: string
                  }
                  Update: {
                    "archived"?: boolean,"color_token"?: string,"icon"?: string,"id"?: string,"name"?: string,"sort_order"?: number,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"devices": {
                  Row: {
                    "created_at": string,"id": string,"key_hash": string,"label": string | null,"last_seen_at": string | null,"revoked_at": string | null,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"key_hash": string,"label"?: string | null,"last_seen_at"?: string | null,"revoked_at"?: string | null,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"key_hash"?: string,"label"?: string | null,"last_seen_at"?: string | null,"revoked_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"groups": {
                  Row: {
                    "archived": boolean,"created_at": string,"id": string,"name": string,"user_id": string
                  }
                  Insert: {
                    "archived"?: boolean,"created_at"?: string,"id"?: string,"name": string,"user_id"?: string
                  }
                  Update: {
                    "archived"?: boolean,"created_at"?: string,"id"?: string,"name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"merchant_memory": {
                  Row: {
                    "category_id": string,"merchant_key": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "category_id": string,"merchant_key": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "category_id"?: string,"merchant_key"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "merchant_memory_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"my_accounts": {
                  Row: {
                    "alias": string | null,"bank_name": string,"created_at": string,"id": string,"last4": string,"user_id": string
                  }
                  Insert: {
                    "alias"?: string | null,"bank_name": string,"created_at"?: string,"id"?: string,"last4": string,"user_id"?: string
                  }
                  Update: {
                    "alias"?: string | null,"bank_name"?: string,"created_at"?: string,"id"?: string,"last4"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"organize_runs": {
                  Row: {
                    "ai_calls": number,"ai_error": string | null,"ai_input_tokens": number,"ai_output_tokens": number,"error": string | null,"failed_count": number,"finished_at": string | null,"id": string,"processed_count": number,"started_at": string,"status": string,"trigger": string,"user_id": string
                  }
                  Insert: {
                    "ai_calls"?: number,"ai_error"?: string | null,"ai_input_tokens"?: number,"ai_output_tokens"?: number,"error"?: string | null,"failed_count"?: number,"finished_at"?: string | null,"id"?: string,"processed_count"?: number,"started_at"?: string,"status"?: string,"trigger": string,"user_id": string
                  }
                  Update: {
                    "ai_calls"?: number,"ai_error"?: string | null,"ai_input_tokens"?: number,"ai_output_tokens"?: number,"error"?: string | null,"failed_count"?: number,"finished_at"?: string | null,"id"?: string,"processed_count"?: number,"started_at"?: string,"status"?: string,"trigger"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"parsed_events": {
                  Row: {
                    "account_last4": string | null,"amount": number | null,"id": string,"kind": string,"merchant": string | null,"occurred_at": string,"parser": string,"raw_id": string,"source_package": string,"transaction_id": string | null,"user_id": string
                  }
                  Insert: {
                    "account_last4"?: string | null,"amount"?: number | null,"id"?: string,"kind": string,"merchant"?: string | null,"occurred_at": string,"parser": string,"raw_id": string,"source_package": string,"transaction_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "account_last4"?: string | null,"amount"?: number | null,"id"?: string,"kind"?: string,"merchant"?: string | null,"occurred_at"?: string,"parser"?: string,"raw_id"?: string,"source_package"?: string,"transaction_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "parsed_events_raw_id_fkey"
      columns: ["raw_id"]
isOneToOne: true
      referencedRelation: "raw_notifications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "parsed_events_transaction_id_fkey"
      columns: ["transaction_id"]
isOneToOne: false
      referencedRelation: "transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"raw_notifications": {
                  Row: {
                    "attempts": number,"body": string,"dedupe_key": string,"id": string,"posted_at": string,"processed_at": string | null,"received_at": string,"source_package": string,"title": string,"user_id": string
                  }
                  Insert: {
                    "attempts"?: number,"body": string,"dedupe_key": string,"id"?: string,"posted_at": string,"processed_at"?: string | null,"received_at"?: string,"source_package": string,"title"?: string,"user_id": string
                  }
                  Update: {
                    "attempts"?: number,"body"?: string,"dedupe_key"?: string,"id"?: string,"posted_at"?: string,"processed_at"?: string | null,"received_at"?: string,"source_package"?: string,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"source_apps": {
                  Row: {
                    "enabled": boolean,"id": string,"label": string,"package_name": string,"user_id": string
                  }
                  Insert: {
                    "enabled"?: boolean,"id"?: string,"label": string,"package_name": string,"user_id"?: string
                  }
                  Update: {
                    "enabled"?: boolean,"id"?: string,"label"?: string,"package_name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"transactions": {
                  Row: {
                    "amount": number | null,"auto_hidden_reason": string | null,"cancelled_at": string | null,"category_id": string | null,"created_at": string,"decided_at": string | null,"group_id": string | null,"id": string,"kind": string,"memo": string | null,"merchant": string | null,"needs_review": boolean,"occurred_at": string,"review_reason": string | null,"status": string,"user_id": string
                  }
                  Insert: {
                    "amount"?: number | null,"auto_hidden_reason"?: string | null,"cancelled_at"?: string | null,"category_id"?: string | null,"created_at"?: string,"decided_at"?: string | null,"group_id"?: string | null,"id"?: string,"kind": string,"memo"?: string | null,"merchant"?: string | null,"needs_review"?: boolean,"occurred_at": string,"review_reason"?: string | null,"status"?: string,"user_id"?: string
                  }
                  Update: {
                    "amount"?: number | null,"auto_hidden_reason"?: string | null,"cancelled_at"?: string | null,"category_id"?: string | null,"created_at"?: string,"decided_at"?: string | null,"group_id"?: string | null,"id"?: string,"kind"?: string,"memo"?: string | null,"merchant"?: string | null,"needs_review"?: boolean,"occurred_at"?: string,"review_reason"?: string | null,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "transactions_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    }
                  ]
                },"user_settings": {
                  Row: {
                    "ai_monthly_call_cap": number,"digest_time": string,"expo_push_token": string | null,"onboarded_at": string | null,"sms_enabled": boolean,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "ai_monthly_call_cap"?: number,"digest_time"?: string,"expo_push_token"?: string | null,"onboarded_at"?: string | null,"sms_enabled"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "ai_monthly_call_cap"?: number,"digest_time"?: string,"expo_push_token"?: string | null,"onboarded_at"?: string | null,"sms_enabled"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "ai_calls_this_month":
{ Args: { "p_user": string }; Returns: number
                           },
"assert_owns_transaction":
{ Args: { "p_tx": string }; Returns: undefined
                           },
"call_edge_function":
{ Args: { "p_name": string }; Returns: number
                           },
"decide_transaction":
{ Args: { "p_category_id": string,"p_group_id": string,"p_id": string,"p_memo": string,"p_merchant_key": string,"p_status": string }; Returns: undefined
                           },
"finish_organize_run":
{ Args: { "p_ai_calls": number,"p_ai_error"?: string,"p_ai_input": number,"p_ai_output": number,"p_error": string,"p_failed": number,"p_processed": number,"p_run": string,"p_status": string }; Returns: undefined
                           },
"increment_raw_attempts":
{ Args: { "p_ids": (string)[] }; Returns: undefined
                           },
"merge_transactions":
{ Args: { "p_source": string,"p_target": string }; Returns: undefined
                           },
"recompute_transaction":
{ Args: { "p_tx": string }; Returns: undefined
                           },
"register_device":
{ Args: { "p_label": string }; Returns: string
                           },
"seed_defaults":
{ Args: { "p_user": string }; Returns: undefined
                           },
"split_transaction":
{ Args: { "p_event_ids": (string)[],"p_tx": string }; Returns: string
                           },
"start_organize_run":
{ Args: { "p_trigger": string,"p_user": string }; Returns: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
