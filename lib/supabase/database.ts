/**
 * Типы схемы Supabase для серверного клиента.
 *
 * Отражают `supabase/migrations/0001_init.sql`. Таблицы доступны только
 * service-role ключу (RLS без политик), поэтому клиент типизирован целиком
 * на «public» схему для внутреннего серверного использования.
 */
import type { GenerationResult } from "@/lib/generation/types";
import type {
  OrderGenerationState,
  OrderStatus,
  PaymentStatus,
  StoredOrderInput,
} from "@/lib/orders/types";

type OrderRow = {
  id: string;
  order_number: string;
  access_token_hash: string;
  access_token_ciphertext: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  input: StoredOrderInput;
  email: string;
  price_rub: number;
  currency: string;
  is_demo: boolean;
  checkout_url: string | null;
  payment_provider: string | null;
  payment_id: string | null;
  generation: OrderGenerationState;
  result: GenerationResult | null;
  pdf_storage_key: string | null;
  email_sent_at: string | null;
  email_error: string | null;
  data_deleted_at: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  completed_at: string | null;
  refunded_at: string | null;
};

type OrderInsert = OrderRow;
type OrderUpdate = Partial<OrderRow>;

type PaymentRow = {
  id: string;
  order_id: string;
  // Ограничение check (provider in ('test', 'yookassa')) живёт в SQL;
  // в клиенте оставлено строкой, чтобы сигнатуры фильтров не дублировали union.
  provider: string;
  provider_payment_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  confirmation_url: string | null;
  idempotence_key: string;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  failure_reason: string | null;
  metadata: Record<string, string | number | boolean | null>;
};

type PaymentInsert = PaymentRow;
type PaymentUpdate = Partial<PaymentRow>;

export type Database = {
  public: {
    Tables: {
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: OrderUpdate;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: PaymentInsert;
        Update: PaymentUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
