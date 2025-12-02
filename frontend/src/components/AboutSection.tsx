'use client';

export function AboutSection() {
  return (
    <section className="mt-12 grid gap-10 rounded-xl bg-white px-6 py-6 md:grid-cols-[1.3fr_1fr] md:px-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0c0d10]">
            About
          </h2>
          <p className="text-[14px] leading-[1.65] text-neutral-700">
            NOHARM is a specialist-validated medical management benchmark to evaluate the accuracy and safety of AI-generated medical recommendations on cases to doctors. The current version covers 10 specialties over 100 cases, and includes 12,747 specialist annotations on beneficial and harmful actions. This project is led and supported by the ARISE AI Research Network, based at Stanford and Harvard.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0c0d10]">
            Attribution
          </h2>
          <p className="text-[14px] leading-[1.65] text-neutral-700">
            This LLM leaderboard displays the latest public benchmark performance for SOTA model versions released after April 2024. The data comes from model providers as well as independently run evaluations by Vellum or the open-source community. We feature results from non-saturated benchmarks, excluding outdated benchmarks (e.g. MMLU). If you want to evaluate these models on your use-cases, get in touch.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0c0d10]">
            Study
          </h2>
          <p className="text-[14px] leading-[1.65] text-neutral-700">
            Please see a detailed manuscript on our study here. (Insert link here)
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0c0d10]">
            Submissions
          </h2>
          <p className="text-[14px] leading-[1.65] text-neutral-700">
            An automated submission portal is in the works. In the meanwhile, please contact us if you are interested benchmarking your model and inclusion in the leaderboard.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0c0d10]">
            Contact
          </h2>
          <ul className="flex list-none flex-col gap-1.5 text-[14px] leading-[1.65] text-neutral-700">
            <li>• David Wu, MD, PhD (dwu@mgh.harvard.edu)</li>
            <li>• Ethan Goh, MD (ethangoh@stanford.edu)</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
