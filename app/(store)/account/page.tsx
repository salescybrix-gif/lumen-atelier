import { Suspense } from "react";
import { AccountView } from "@/components/account/AccountView";

export const metadata = { title: "My account" };

export default function AccountPage() {
  return (
    <Suspense>
      <AccountView />
    </Suspense>
  );
}
