import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms for using ${siteConfig.name}'s free, in-browser file tools.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="June 2026">
      <p>
        By using {siteConfig.name}, you agree to these terms. They are short and clear on
        purpose.
      </p>

      <section>
        <h2>1. The service</h2>
        <p>
          {siteConfig.name} provides free, browser-based tools for working with files. All
          processing happens locally in your browser. We do not store, transmit, or have
          access to your files.
        </p>
      </section>

      <section>
        <h2>2. No warranty</h2>
        <p>
          The tools are provided <strong>&quot;as is&quot;</strong> without warranty of any
          kind. While we work hard to make them reliable, we cannot guarantee that every
          conversion will be perfect. Always keep a backup of your original files, and verify
          important output.
        </p>
      </section>

      <section>
        <h2>3. Acceptable use</h2>
        <ul>
          <li>Don&apos;t use the service to process files you don&apos;t have the right to use.</li>
          <li>Don&apos;t attempt to disrupt, reverse-engineer, or overload the service.</li>
          <li>Don&apos;t use automated scripts to abuse the service.</li>
        </ul>
      </section>

      <section>
        <h2>4. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, {siteConfig.name} and its authors are not
          liable for any damages or data loss arising from the use of, or inability to use,
          the service. Because all processing is local, any data loss would occur on your own
          device.
        </p>
      </section>

      <section>
        <h2>5. Advertising</h2>
        <p>
          The service is supported by ads (Google AdSense) shown only to users who have
          consented. Ad content is delivered by third parties and is not endorsed by{" "}
          {siteConfig.name}.
        </p>
      </section>

      <section>
        <h2>6. Changes</h2>
        <p>
          We may update these terms occasionally. Continued use after changes means you accept
          the updated terms.
        </p>
      </section>

      <section>
        <h2>7. Contact</h2>
        <p>
          Questions? Email{" "}
          <a
            href="mailto:fileflex.support@gmail.com"
            aria-label="Send email to FileFlex"
          >
            fileflex.support@gmail.com
          </a>.
        </p>
      </section>
    </LegalLayout>
  );
}
