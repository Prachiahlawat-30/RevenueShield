import { apiClient } from './client';
import { Customer, RevenueRisk, Transaction } from '../types';

export interface ListCustomersParams {
  search?: string;
  is_opted_out?: boolean;
  page?: number;
  page_size?: number;
}

export interface PaginatedCustomers {
  items: Customer[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CustomerDetail extends Customer {
  transactions: Transaction[];
  revenue_risks: RevenueRisk[];
}

export const getCustomers = async (params: ListCustomersParams = {}): Promise<PaginatedCustomers> => {
  const res = await apiClient.get<PaginatedCustomers>('/customers', { params });
  return res.data;
};

export const getCustomerDetail = async (customerId: string): Promise<CustomerDetail> => {
  const res = await apiClient.get<CustomerDetail>(`/customers/${customerId}`);
  return res.data;
};

export const toggleCustomerOptOut = async (
  customerId: string,
  isOptedOut: boolean
): Promise<Customer> => {
  const res = await apiClient.patch<Customer>(`/customers/${customerId}/opt-out`, {
    is_opted_out: isOptedOut,
  });
  return res.data;
};
