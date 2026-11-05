import { ProductRequestItem } from '@/types/models';

/** Column labels, already translated. Client-side for the same reason as the products export. */
export interface ProductRequestExportLabels {
  sheetName: string;
  name: string;
  invoiceName: string;
  description: string;
  price: string;
  store: string;
  quantity: string;
  photo: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  status: string;
  note: string;
  statusLabel: (item: ProductRequestItem) => string;
}

export async function exportProductRequestsToExcel(
  items: ProductRequestItem[],
  labels: ProductRequestExportLabels
): Promise<void> {
  const XLSX = await import('xlsx');

  const rows = items.map((item) => {
    const { user } = item.request;
    return {
      [labels.name]: item.name,
      [labels.invoiceName]: item.invoice_name ?? '',
      [labels.description]: item.description,
      [labels.price]: item.estimated_price,
      [labels.store]: item.store,
      [labels.quantity]: item.quantity,
      [labels.photo]: item.photo_url ?? '',
      [labels.customer]: `${user.first_name} ${user.last_name}`,
      [labels.email]: user.email,
      [labels.phone]: user.phone_number ?? '',
      [labels.date]: new Date(item.created_at).toLocaleString('ka-GE'),
      [labels.status]: labels.statusLabel(item),
      [labels.note]: item.admin_note ?? '',
    };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), labels.sheetName);
  XLSX.writeFile(workbook, `product-requests-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
