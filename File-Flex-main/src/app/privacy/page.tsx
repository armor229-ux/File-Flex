import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} handles your data: everything is processed in your browser, with no file uploads.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 2026">
      <p>
        {siteConfig.name} is built around a simple promise: <strong>your files never leave
        your device.</strong> This policy explains exactly what we do — and don&apos;t do — with
        your data.
      </p>

      <section>
        <h2>1. File processing</h2>
        <p>
          Every tool on {siteConfig.name} runs entirely in your web browser using JavaScript.
          When you open a file in any tool, it is read into your browser&apos;s memory and
          processed locally. <strong>Your files are never uploaded to, stored on, or seen by
          any server.</strong> There is no cloud storage and no server-side processing of your
          files.
        </p>
      </section>

      <section>
        <h2>2. What we don&apos;t collect</h2>
        <ul>
          <li>The contents or names of the files you process.</li>
          <li>Accounts — there is no signup, so we have no account data.</li>
          <li>Personal information beyond what is described below.</li>
        </ul>
      </section>

      <section>
        <h2>3. Cookies and similar technologies</h2>
        <p>
          We only use cookies for ads and basic analytics, and only after you give consent via
          the cookie banner. You can decline and still use every tool. The categories are:
        </p>
        <ul>
          <li>
            <strong>Necessary</strong> — used to remember your cookie preferences. Always on.
          </li>
          <li>
            <strong>Analytics</strong> — privacy-friendly, aggregated usage statistics to
            understand which tools are popular.
          </li>
          <li>
            <strong>Advertising (Google AdSense)</strong> — used to serve and measure ads that
            keep the site free. Google and its partners may use cookies to serve ads based on
            your prior visits to this and other websites.
          </li>
        </ul>
        <p>
          You can change your choices at any time on our{" "}
          <a href="/cookies">Cookies</a> page.
        </p>
      </section>

      <section>
        <h2>4. Third-party services</h2>
        <p>
          When ads or analytics are enabled (only with your consent), the following third
          parties may process data:
        </p>
        <ul>
          <li>
            <strong>Google AdSense</strong> — serves advertisements. See{" "}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
              Google&apos;s ad technology policy
            </a>
            .
          </li>
        </ul>
        <p>
          No third party ever receives your processed files — third-party scripts are limited
          to ads/analytics and cannot access the files you open in the tools.
        </p>
      </section>

      <section>
        <h2>5. Local storage</h2>
        <p>
          We use your browser&apos;s <code>localStorage</code> to remember your theme (light or
          dark) and your cookie consent choice. This data never leaves your browser.
        </p>
      </section>

      <section>
        <h2>6. Children&apos;s privacy</h2>
        <p>
          {siteConfig.name} is not directed at children under 13, and we do not knowingly
          collect personal information from children.
        </p>
      </section>

      <section>
        <h2>7. Your rights</h2>
        <p>
          Because we don&apos;t store your files or personal data on our servers, there is no
          personal data to access or delete. You can clear your consent and theme preferences
          at any time using your browser&apos;s &quot;clear site data&quot; feature or the
          Cookies page.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          Questions about privacy? Email{" "}
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
