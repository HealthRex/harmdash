import { Dashboard } from "@/components/Dashboard";
import { getDataset } from "../lib/getDataset";

export default async function HomePage() {
  const dataset = await getDataset();

  return (
    <main className="">
      <Dashboard dataset={dataset} />
    </main>
  );
}
