import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { paymentUtils } from "../lib/payment-utils";
import { paymentKeys } from "./use-payments";
import type {
  PaymentMethod,
  PaymentStatus,
} from "@/features/database/lib/types";

interface UseAllPaymentsParams {
  search?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

interface Payment {
  id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  receipt_number: string;
  payment_date: string;
  member?: {
    first_name: string;
    last_name: string;
  };
}

export interface AllPaymentsResponse {
  payments: Payment[];
  totalCount: number;
  summary: {
    totalRevenue: number;
    totalRefunded: number;
    paymentCount: number;
  };
}

/**
 * Get all payments with filtering and pagination
 */
export function useAllPayments(params: UseAllPaymentsParams = {}) {
  return useQuery({
    queryKey: paymentKeys.allPayments(params),
    queryFn: () => paymentUtils.getAllPayments(params),
    placeholderData: keepPreviousData, // Smooth transitions when filters change
    staleTime: 2 * 60 * 1000, // 2 minutes - payment data changes frequently
  });
}
