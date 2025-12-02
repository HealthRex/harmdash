'use client';

export function PageHeader() {
  return (
    <header className="flex flex-col items-center gap-8 pb-8 pt-6 text-center">
      <div className="flex flex-col items-center gap-6">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
          NOHARM
        </span>
        <h1 className="max-w-4xl text-[52px] font-normal leading-[1.1] tracking-[-0.02em] text-[#0c0d10]">
          MAST: Medical AI Superintelligence Test
        </h1>
        <p className="max-w-2xl text-[17px] font-normal leading-relaxed text-neutral-600">
          Introducing MAST, our vision for a suite of clinically realistic benchmarks to evaluate performance of healthcare AI systems. First, do NOHARM, a new framework towards clinical safety in LLM systems.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href="https://arxiv.org/abs/2512.01241"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-[15px] font-medium text-[#0c0d10] transition-all hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
        >
          Read the paper
        </a>
        <a
          href="https://arise-ai.org"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#0c0d10] px-6 py-2.5 text-[15px] font-medium text-white transition-all hover:bg-[#1a1b1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c0d10]/60"
        >
          Visit arise-ai.org
        </a>
      </div>
    </header>
  );
}
