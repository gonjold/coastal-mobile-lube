import { getHeroCopy } from "@/lib/firebase-admin";
import PageClient from "./page-client";

export const revalidate = 300;

export default async function Page() {
  const heroCopy = await getHeroCopy();
  return <PageClient heroCopy={heroCopy} />;
}
