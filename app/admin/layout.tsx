import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = { title: { default: "Admin", template: "%s · Lumen Admin" } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
