export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin pages don't use the regular header/footer
  return <>{children}</>;
}
