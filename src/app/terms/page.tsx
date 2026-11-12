import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_CONTACT, LEGAL_OPERATOR, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using Supabox.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 12, 2026">
      <p>
        These terms apply to your use of Supabox at supaboxd.com, operated by {LEGAL_OPERATOR}. By creating an account or
        using Supabox you agree to them. If you don&apos;t agree, please don&apos;t use Supabox. Supabox is in early access
        (beta), so features may change, and things may occasionally break.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 13 years old (or the minimum age in your country) to create an account.</li>
        <li>Keep your password safe; you are responsible for activity on your account.</li>
        <li>Choose a username that doesn&apos;t impersonate someone else or infringe anyone&apos;s rights.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You own the reviews, lists and other content you post. You give Supabox a non-exclusive, worldwide, royalty-free
        license to store, display and distribute that content on Supabox so the service can work (for example, showing
        your reviews to other users). This license ends when you delete the content or your account.
      </p>

      <h2>Community rules</h2>
      <p>Don&apos;t use Supabox to:</p>
      <ul>
        <li>harass, threaten or bully others, or post hateful or sexually explicit content;</li>
        <li>post spam, scams, malware, or content you don&apos;t have the right to share;</li>
        <li>reveal other people&apos;s private information;</li>
        <li>break the law, or try to break, overload or gain unauthorized access to Supabox;</li>
        <li>scrape or bulk-download Supabox data without permission.</li>
      </ul>
      <p>Mark reviews that reveal story details as containing spoilers.</p>
      <p>
        We may remove content or suspend accounts that break these rules. If you see something that does, email{" "}
        <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>.
      </p>

      <h2>Game information</h2>
      <p>
        Game data, cover art and logos are provided by IGDB.com and belong to their respective owners. Critic scores are
        averages of published reviews. Supabox is not affiliated with any game publisher or platform.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can delete your account at any time from <Link href="/profile/edit">Edit profile</Link>. We may suspend or
        close accounts that seriously or repeatedly break these terms.
      </p>

      <h2>Disclaimers</h2>
      <p>
        Supabox is provided &quot;as is&quot;, without warranties of any kind, to the extent permitted by law. We are not
        liable for indirect or consequential losses, or for content posted by users. Nothing in these terms limits rights
        you have as a consumer that cannot be limited by contract.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. If changes are significant, we will let you know on the site or by email before they
        take effect. Continuing to use Supabox after that means you accept the new terms.
      </p>

      <h2>Contact</h2>
      <p>
        {LEGAL_OPERATOR} — <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>. See also our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
