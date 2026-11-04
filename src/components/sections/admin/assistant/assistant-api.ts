'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';
import type { AssistantFaqValues, AssistantSettingsValues } from '@/lib/validations/assistant';

export interface AssistantSettings {
  enabled: boolean;
  model: string | null;
  extra_instructions: string | null;
  rate_limit: number;
  button_label_ka: string | null;
  button_label_en: string | null;
  welcome_title_ka: string | null;
  welcome_title_en: string | null;
  welcome_text_ka: string | null;
  welcome_text_en: string | null;
  examples_ka: string[];
  examples_en: string[];
  button_color: string | null;
  button_position: 'right' | 'left';
  show_on_mobile: boolean;
  updated_at: string;
}

export interface AssistantSettingsResponse {
  settings: AssistantSettings;
  env: { has_api_key: boolean; env_disabled: boolean; env_model: string | null };
  effective: { enabled: boolean; model: string };
  default_model: string;
}

export interface AssistantFaq {
  id: string;
  question_ka: string;
  question_en: string;
  answer_ka: string;
  answer_en: string;
  is_active: boolean;
  sort_order: number;
}

/** Authenticated JSON request to an admin route; throws the server's error message. */
export async function adminRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body as T;
}

const SETTINGS_KEY = ['admin', 'assistant', 'settings'];
const FAQS_KEY = ['admin', 'assistant', 'faqs'];

export function useAssistantSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => adminRequest<AssistantSettingsResponse>('/api/admin/assistant/settings'),
  });
}

export function useSaveAssistantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AssistantSettingsValues) =>
      adminRequest<AssistantSettingsResponse>('/api/admin/assistant/settings', {
        method: 'PUT',
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => queryClient.setQueryData(SETTINGS_KEY, data),
  });
}

export function useAssistantFaqs() {
  return useQuery({
    queryKey: FAQS_KEY,
    queryFn: async () => (await adminRequest<{ data: AssistantFaq[] }>('/api/admin/assistant/faqs')).data,
  });
}

export function useFaqMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: FAQS_KEY });
  return {
    create: useMutation({
      mutationFn: (values: AssistantFaqValues) =>
        adminRequest<AssistantFaq>('/api/admin/assistant/faqs', { method: 'POST', body: JSON.stringify(values) }),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, values }: { id: string; values: Partial<AssistantFaqValues> }) =>
        adminRequest<AssistantFaq>(`/api/admin/assistant/faqs/${id}`, { method: 'PATCH', body: JSON.stringify(values) }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => adminRequest(`/api/admin/assistant/faqs/${id}`, { method: 'DELETE' }),
      onSuccess,
    }),
    importSite: useMutation({
      mutationFn: () =>
        adminRequest<{ imported: number; skipped: number }>('/api/admin/assistant/faqs/import', { method: 'POST' }),
      onSuccess,
    }),
  };
}
