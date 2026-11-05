'use client';

import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { useTranslations } from 'next-intl';
import {
  ALLOWED_PHOTO_TYPES,
  isValidPhoneNumber,
  MAX_PHOTO_BYTES,
  MAX_PRODUCTS_PER_REQUEST,
  MAX_REQUESTS_PER_HOUR,
} from '@/lib/validations/product-request';
import { useAuth } from '@/providers';
import { productRequestsService } from '@/services/productRequests';
import {
  clearDraft,
  createRow,
  createRows,
  isEmptyRow,
  loadDraft,
  ProductRow,
  RowErrors,
  ROWS_STEP,
  saveDraft,
  toItemInput,
  validateRow,
} from './product-rows';

function initialRows(uid: string): ProductRow[] {
  const draft = loadDraft(uid);
  return [...draft, ...createRows(Math.max(0, ROWS_STEP - draft.length))];
}

/** All the form's state. The mobile pages and the desktop grid are two views of it. */
export function useProductRequestForm(user: User, onSent: () => void) {
  const t = useTranslations('productRequest');
  const { dbUser, refreshDbUser } = useAuth();

  const [rows, setRows] = useState(() => initialRows(user.uid));
  const [activeId, setActiveId] = useState(() => rows[0].id);
  const [rowErrors, setRowErrors] = useState<Record<string, RowErrors>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingIds, setUploadingIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(false);
  // The profile may not have loaded yet when the user sends; the server has the final word.
  const [serverNeedsPhone, setServerNeedsPhone] = useState(false);

  const needsPhone = serverNeedsPhone || (dbUser !== null && !dbUser.phone_number);

  useEffect(() => {
    saveDraft(user.uid, rows);
  }, [user.uid, rows]);

  const enteredRows = rows.filter((row) => !isEmptyRow(row));

  // The active row can be deleted in the grid, and a resize then lands on mobile.
  const currentId = rows.some((row) => row.id === activeId) ? activeId : rows[0].id;

  // Mobile shows one page per entered product, plus the one being filled in.
  const mobileRows = rows.filter((row) => !isEmptyRow(row) || row.id === currentId);
  const activeIndex = mobileRows.findIndex((row) => row.id === currentId);

  const setFieldErrors = (id: string, errors: RowErrors) => {
    setRowErrors((current) => ({ ...current, [id]: { ...current[id], ...errors } }));
  };

  const updateRow = (id: string, patch: Partial<ProductRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setFormError(null);
    setRowErrors((current) => {
      if (!current[id]) return current;
      const remaining = { ...current[id] };
      Object.keys(patch).forEach((field) => delete remaining[field as keyof RowErrors]);

      const next = { ...current };
      if (Object.keys(remaining).length > 0) {
        next[id] = remaining;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const choosePhoto = async (id: string, file: File) => {
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setFieldErrors(id, { photo_url: 'productRequest.errors.photoType' });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setFieldErrors(id, { photo_url: 'productRequest.errors.photoSize' });
      return;
    }

    setUploadingIds((current) => [...current, id]);
    try {
      const url = await productRequestsService.uploadPhoto(user, file);
      updateRow(id, { photo_url: url });
    } catch {
      setFieldErrors(id, { photo_url: 'productRequest.errors.photoUpload' });
    } finally {
      setUploadingIds((current) => current.filter((uploadingId) => uploadingId !== id));
    }
  };

  const showRowErrors = (id: string, errors: RowErrors) => {
    setFormError(null);
    setRowErrors((current) => ({ ...current, [id]: errors }));
  };

  /** Mobile: keep this product and move on to the next one. */
  const goToNext = () => {
    const current = mobileRows[activeIndex];
    const errors = validateRow(current);
    if (Object.keys(errors).length > 0) {
      showRowErrors(current.id, errors);
      return;
    }

    setFormError(null);
    const next = mobileRows[activeIndex + 1];
    if (next) {
      setActiveId(next.id);
    } else if (enteredRows.length >= MAX_PRODUCTS_PER_REQUEST) {
      setFormError(t('errors.maxProducts', { max: MAX_PRODUCTS_PER_REQUEST }));
      return;
    } else {
      // Must come after the current product, or the new page would open before it.
      const blank = rows.slice(rows.findIndex((row) => row.id === current.id) + 1).find(isEmptyRow);
      if (blank) {
        setActiveId(blank.id);
      } else {
        const row = createRow();
        setRows((existing) => [...existing, row]);
        setActiveId(row.id);
      }
    }
    window.scrollTo({ top: 0 });
  };

  const goToPrevious = () => {
    const previous = mobileRows[activeIndex - 1];
    if (previous) {
      setFormError(null);
      setActiveId(previous.id);
      window.scrollTo({ top: 0 });
    }
  };

  /** Desktop: "add more products". */
  const addRows = () => {
    const room = MAX_PRODUCTS_PER_REQUEST - rows.length;
    if (room <= 0) {
      setFormError(t('errors.maxProducts', { max: MAX_PRODUCTS_PER_REQUEST }));
      return;
    }
    setFormError(null);
    setRows((current) => [...current, ...createRows(Math.min(ROWS_STEP, room))]);
  };

  const deleteRow = (id: string) => {
    setFormError(null);
    setRows((current) => {
      const remaining = current.filter((row) => row.id !== id);
      return remaining.length > 0 ? remaining : [createRow()];
    });
    setRowErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const send = async () => {
    setFormError(null);

    if (enteredRows.length === 0) {
      setRowErrors({});
      setFormError(t('errors.noProducts'));
      return;
    }
    if (enteredRows.length > MAX_PRODUCTS_PER_REQUEST) {
      setFormError(t('errors.tooMany', { max: MAX_PRODUCTS_PER_REQUEST, count: enteredRows.length }));
      return;
    }
    if (uploadingIds.length > 0) {
      setFormError(t('errors.photoUploading'));
      return;
    }

    const errors: Record<string, RowErrors> = {};
    for (const row of enteredRows) {
      const rowError = validateRow(row);
      if (Object.keys(rowError).length > 0) errors[row.id] = rowError;
    }
    setRowErrors(errors);

    const firstInvalid = enteredRows.find((row) => errors[row.id]);
    if (firstInvalid) setActiveId(firstInvalid.id);

    const phoneInvalid = needsPhone && !isValidPhoneNumber(phone);
    setPhoneError(phoneInvalid);
    if (phoneInvalid) setFormError(t('errors.phone'));

    if (firstInvalid || phoneInvalid) return;

    setSending(true);
    try {
      await productRequestsService.create(user, {
        phone_number: needsPhone ? phone : undefined,
        items: enteredRows.map(toItemInput),
      });
      clearDraft(user.uid);
      void refreshDbUser();
      onSent();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'rate_limited') {
        setFormError(t('errors.rateLimited', { max: MAX_REQUESTS_PER_HOUR }));
      } else if (code === 'phone_required') {
        setServerNeedsPhone(true);
        setPhoneError(true);
        setFormError(t('errors.phone'));
      } else {
        setFormError(t('errors.generic'));
      }
    } finally {
      setSending(false);
    }
  };

  return {
    rows,
    mobileRows,
    activeIndex,
    rowErrors,
    formError,
    uploadingIds,
    sending,
    phone,
    phoneError,
    needsPhone,
    setPhone: (value: string) => {
      setPhone(value);
      setPhoneError(false);
      setFormError(null);
    },
    updateRow,
    choosePhoto,
    goToNext,
    goToPrevious,
    addRows,
    deleteRow,
    send,
  };
}

export type ProductRequestFormState = ReturnType<typeof useProductRequestForm>;
