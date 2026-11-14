import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { commit, getDb, publicUser } from "@/lib/db";
import { error, json, requireUser } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth-edge";
import { cardBrand, luhn, uid } from "@/lib/utils";
import type { Address, PaymentMethod } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Account mutations, dispatched by `action`:
 *  profile        { name, email }
 *  password       { currentPassword, newPassword }
 *  saveAddress    { address }            (create or update by id)
 *  deleteAddress  { id }
 *  addPayment     { number, exp, name }  (only brand + last4 are stored)
 *  deletePayment  { id }
 *  setDefault     { kind: "address" | "payment", id }
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth.ctx;
  const body = await req.json().catch(() => ({}));
  const db = getDb();

  switch (body.action) {
    case "profile": {
      const name = String(body.name ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      if (name.length < 2) return error("Please enter your name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Please enter a valid email.");
      if (db.users.some((u) => u.email === email && u.id !== user.id)) return error("That email is already in use.", 409);
      user.name = name;
      user.email = email;
      cookies().set(SESSION_COOKIE, await signSession({ id: user.id, name, email, role: user.role }), sessionCookieOptions);
      break;
    }
    case "password": {
      if (!(await bcrypt.compare(String(body.currentPassword ?? ""), user.passwordHash))) return error("Your current password is incorrect.");
      if (String(body.newPassword ?? "").length < 8) return error("New password must be at least 8 characters.");
      user.passwordHash = await bcrypt.hash(String(body.newPassword), 10);
      break;
    }
    case "saveAddress": {
      const a = body.address as Address;
      if (![a?.fullName, a?.line1, a?.city, a?.region, a?.postalCode, a?.country].every((v) => String(v ?? "").trim())) {
        return error("Please complete all required address fields.");
      }
      const clean: Address = {
        id: a.id || uid("adr"),
        label: a.label?.trim() || "Address",
        fullName: a.fullName.trim(),
        line1: a.line1.trim(),
        line2: a.line2?.trim() || undefined,
        city: a.city.trim(),
        region: a.region.trim(),
        postalCode: a.postalCode.trim(),
        country: a.country.trim(),
        phone: a.phone?.trim() || undefined,
        isDefault: user.addresses.length === 0 || !!a.isDefault,
      };
      if (clean.isDefault) user.addresses.forEach((x) => (x.isDefault = false));
      const idx = user.addresses.findIndex((x) => x.id === clean.id);
      if (idx >= 0) user.addresses[idx] = clean;
      else user.addresses.push(clean);
      break;
    }
    case "deleteAddress": {
      user.addresses = user.addresses.filter((a) => a.id !== body.id);
      if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) user.addresses[0].isDefault = true;
      break;
    }
    case "addPayment": {
      const number = String(body.number ?? "").replace(/\s/g, "");
      if (!luhn(number)) return error("Card number is invalid.");
      const [mm, yy] = String(body.exp ?? "").split("/").map((s) => Number(s.trim()));
      if (!mm || mm > 12 || !yy) return error("Expiry must be MM/YY.");
      const pm: PaymentMethod = {
        id: uid("pm"),
        brand: cardBrand(number),
        last4: number.slice(-4),
        expMonth: mm,
        expYear: 2000 + yy,
        holder: String(body.name ?? user.name).trim() || user.name,
        isDefault: user.paymentMethods.length === 0,
      };
      user.paymentMethods.push(pm);
      break;
    }
    case "deletePayment": {
      user.paymentMethods = user.paymentMethods.filter((p) => p.id !== body.id);
      if (user.paymentMethods.length && !user.paymentMethods.some((p) => p.isDefault)) user.paymentMethods[0].isDefault = true;
      break;
    }
    case "setDefault": {
      const list = body.kind === "payment" ? user.paymentMethods : user.addresses;
      list.forEach((x: { id: string; isDefault?: boolean }) => (x.isDefault = x.id === body.id));
      break;
    }
    default:
      return error("Unknown action.");
  }
  commit();
  return json({ profile: publicUser(user) });
}
