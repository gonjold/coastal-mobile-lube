import { CreateBookingClient } from "./CreateBookingClient";

export const dynamic = "force-dynamic";

export default async function FieldNewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp.customerId;
  const customerId = Array.isArray(raw) ? raw[0] : raw;
  return <CreateBookingClient initialCustomerId={customerId} />;
}
