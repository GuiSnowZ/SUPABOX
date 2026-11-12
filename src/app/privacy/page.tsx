import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_CONTACT, LEGAL_OPERATOR, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Supabox collects, why, who processes it, and your rights.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 12, 2026">
      <p>
        Supabox (&quot;we&quot;) is a social diary for video games at supaboxd.com, operated by {LEGAL_OPERATOR}. This
        policy explains what personal data we collect, why, who helps us process it, and the rights you have, including
        under Brazil&apos;s General Data Protection Law (LGPD) and the EU/UK GDPR where they apply.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> your email address and a password (stored only as a secure hash by our
          authentication provider — we never see it), your username, display name and bio.
        </li>
        <li>
          <strong>What you add to Supabox:</strong> your library and wishlist, ratings, reviews, diary entries, lists,
          favorite games and who you follow.
        </li>
        <li>
          <strong>Technical data:</strong> a session cookie that keeps you signed in, and standard server logs (such as IP
          address, browser type and time of request) kept by our hosting providers for security and reliability.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> use advertising, sell your data, or use third-party tracking or analytics cookies. The
        only cookies we set are the ones strictly needed to keep you signed in.
      </p>

      <h2>What is public</h2>
      <p>
        Your profile (username, display name, bio), library, ratings, reviews, diary, favorites, public lists and follows
        are visible to anyone, because sharing your gaming life is what Supabox is for. Lists you mark as{" "}
        <strong>private</strong> are visible only to you. Your email address is never shown publicly.
      </p>

      <h2>Why we use your data (legal bases)</h2>
      <ul>
        <li>To provide your account and the features you use — performance of our contract with you.</li>
        <li>To keep Supabox secure and prevent abuse — our legitimate interests.</li>
        <li>To send account emails (confirmation, password reset) — performance of our contract with you.</li>
        <li>To comply with legal obligations when required.</li>
      </ul>

      <h2>Who processes your data for us</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — database and authentication.
        </li>
        <li>
          <strong>Vercel</strong> — website hosting.
        </li>
        <li>
          <strong>Resend</strong> — sending account emails.
        </li>
      </ul>
      <p>
        These providers may store data on servers outside your country, including in the United States. They process it
        only on our instructions and under their own security and data protection commitments. Game information and
        images come from IGDB.com; we do not share your personal data with IGDB.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your data while your account exists. When you delete your account, your profile and everything you added
        are deleted from our database immediately. Server logs held by our hosting providers are kept for a limited time
        under their retention policies.
      </p>

      <h2>Your rights</h2>
      <p>
        You can access, correct, download (portability) and delete your data, and ask about how it is processed. You can
        do most of this yourself:
      </p>
      <ul>
        <li>
          <strong>Correct:</strong> edit your profile at <Link href="/profile/edit">Edit profile</Link>.
        </li>
        <li>
          <strong>Download:</strong> use &quot;Download my data&quot; on the <Link href="/profile/edit">Edit profile</Link>{" "}
          page.
        </li>
        <li>
          <strong>Delete:</strong> use &quot;Delete my account&quot; on the same page. This cannot be undone.
        </li>
      </ul>
      <p>
        For anything else, or to object to or restrict processing, email <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>.
        We aim to reply within 15 days. You also have the right to complain to a data protection authority, such as
        Brazil&apos;s ANPD.
      </p>

      <h2>Children</h2>
      <p>
        Supabox is not intended for children under 13 (or the minimum age required in your country). If you believe a
        child has created an account, contact us and we will delete it.
      </p>

      <h2>Security</h2>
      <p>
        Connections are encrypted (HTTPS), passwords are hashed by our authentication provider, and database access rules
        ensure people can only change their own data. No system is perfectly secure; if a breach affects you, we will
        notify you and the authorities as the law requires.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy in a meaningful way, we will update the date above and, where appropriate, let you know
        by email or on the site.
      </p>

      <h2>Contact</h2>
      <p>
        {LEGAL_OPERATOR} — <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>
      </p>
    </LegalPage>
  );
}
