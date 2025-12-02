'use client';

export function AboutSection() {
  return (
    <section className="mt-12 grid gap-10 rounded-xl bg-[#f4f4f5] px-6 py-6 md:grid-cols-[1.3fr_1fr] md:px-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0c0d10]">
            About
          </h2>
          <p className="text-[14px] leading-[1.65] text-neutral-700">
            NOHARM is a specialist-validated medical benchmark to evaluate the accuracy and safety of AI-generated medical recommendations, grounded in real medical cases. The current version covers 10 specialties over 100 cases, and includes 12,747 specialist annotations on beneficial and harmful medical actions that can be taken in the 100 cases. This project is led and supported by the ARISE AI Research Network, based at Stanford and Harvard.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0c0d10]">
            Study
          </h2>
          <p className="text-[14px] leading-[1.65] text-neutral-700">
            For details, see{" "}
            <a
              href="https://arxiv.org/abs/2512.01241"
              className="font-medium text-blue-600 hover:text-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              our study
            </a>
            .
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-6">
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
            <li>
              David Wu, MD, PhD{" "}
              <a
                href="mailto:dwu@mgh.harvard.edu"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                dwu@mgh.harvard.edu
              </a>
            </li>
            <li>Adam Rodman, MD</li>
            <li>Jonathan Chen, MD, PhD</li>
            <li>Ethan Goh, MD</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
