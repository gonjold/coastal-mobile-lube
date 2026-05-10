import { getHeroCopy, getServices, getServiceCategories } from "@/lib/firebase-admin";
import PageClient from "./page-client";

export const revalidate = 300;

export default async function Page() {
  const [heroCopy, services, serviceCategories] = await Promise.all([
    getHeroCopy(),
    getServices(),
    getServiceCategories(),
  ]);
  return (
    <PageClient
      heroCopy={heroCopy}
      services={services}
      serviceCategories={serviceCategories}
    />
  );
}
