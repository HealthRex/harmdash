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
          <p className="text-[14px] leading-[1.65] text-neutral-700">
            <a
              href="https://forms.gle/9Aiaf2NvEnGfm9ue6"
              className="font-medium text-blue-600 hover:text-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Reach out to our team.
            </a>
          </p>
        </div>
      </div>
      <div className="md:col-span-2">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#0c0d10]">
            Study Authors
          </h2>
          <p className="text-[14px] leading-[1.65] text-neutral-700">
            David Wu, Fateme Nateghi Haredasht, Saloni Kumar Maharaj, Priyank Jain, Jessica Tran, Matthew Gwiazdon, Arjun Rustagi, Jenelle Jindal, Jacob M. Koshy, Vinay Kadiyala, Anup Agarwal, Bassman Tappuni, Brianna French, Sirus Jesudasen, Christopher V. Cosgriff, Rebanta Chakraborty, Jillian Caldwell, Susan Ziolkowski, David J. Iberri, Robert Diep, Rahul S. Dalal, Kira L. Newman, Kristin Galetta, J. Carl Pallais, Nancy Wei, Kathleen M. Buchheit, David I. Hong, Ernest Y. Lee, Allen Shih, Vartan Pahalyants, Tamara B. Kaplan, Vishnu Ravi, Sarita Khemani, April S. Liang, Daniel Shirvani, Advait Patil, Nicholas Marshall, Kanav Chopra, Joel Koh, Adi Badhwar, Liam G. McCoy, David J. H. Wu, Yingjie Weng, Sumant Ranji, Kevin Schulman, Nigam H. Shah, Jason Hom, Arnold Milstein, Adam Rodman, Jonathan H. Chen, Ethan Goh
          </p>
        </div>
      </div>
    </section>
  );
}
