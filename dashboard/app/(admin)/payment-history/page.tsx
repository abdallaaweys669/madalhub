import { redirect } from "next/navigation";

export default function PaymentHistoryRedirectPage() {
  redirect("/payments?tab=history");
}
