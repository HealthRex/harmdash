import { Dashboard } from "@/components/Dashboard";
import { getDataset } from "@/lib/getDataset";

export default async function HomePage() {
  const dataset = await getDataset();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-8 md:px-8 lg:px-0">
      <Dashboard dataset={dataset} />
    </main>
  );
}
