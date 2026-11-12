import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { LEGAL_CONTACT, LEGAL_OPERATOR, LegalPage } from "@/components/legal/legal-page";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { locale } = await getT(params);
  return locale === "pt-BR"
    ? { title: "Política de Privacidade", description: "O que o Supabox coleta, por quê, quem trata os dados e quais são seus direitos." }
    : { title: "Privacy Policy", description: "What Supabox collects, why, who processes it, and your rights." };
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { locale } = await getT(params);
  return locale === "pt-BR" ? <PrivacyPt /> : <PrivacyEn />;
}

function PrivacyPt() {
  return (
    <LegalPage title="Política de Privacidade" updated="12 de novembro de 2026" updatedLabel="Última atualização:">
      <p>
        O Supabox (&quot;nós&quot;) é um diário social de videogames em supaboxd.com, operado por {LEGAL_OPERATOR}. Esta
        política explica quais dados pessoais coletamos, por quê, quem nos ajuda a tratá-los e quais são os seus direitos,
        inclusive pela Lei Geral de Proteção de Dados (LGPD) e, quando aplicável, pelo GDPR da UE/Reino Unido.
      </p>

      <h2>O que coletamos</h2>
      <ul>
        <li>
          <strong>Dados da conta:</strong> seu e-mail e uma senha (guardada apenas como hash seguro pelo nosso provedor de
          autenticação — nós nunca a vemos), seu nome de usuário, nome de exibição e bio.
        </li>
        <li>
          <strong>O que você adiciona ao Supabox:</strong> sua biblioteca e lista Quero Jogar, notas, reviews, entradas do
          diário, listas, jogos favoritos, foto de perfil, curtidas, comentários e quem você segue.
        </li>
        <li>
          <strong>Dados técnicos:</strong> um cookie de sessão que mantém você conectado, um cookie com o idioma escolhido e
          registros padrão de servidor (como endereço IP, tipo de navegador e horário do acesso) mantidos pelos nossos
          provedores de hospedagem para segurança e estabilidade.
        </li>
      </ul>
      <p>
        Nós <strong>não</strong> usamos publicidade, não vendemos seus dados e não usamos cookies de rastreamento ou
        análise de terceiros. Os únicos cookies que usamos são os estritamente necessários para manter você conectado e
        lembrar seu idioma.
      </p>

      <h2>O que é público</h2>
      <p>
        Seu perfil (nome de usuário, nome de exibição, bio e foto), biblioteca, notas, reviews, diário, favoritos, listas
        públicas, comentários e quem você segue ficam visíveis para qualquer pessoa, porque compartilhar sua vida de jogador
        é a proposta do Supabox. Listas marcadas como <strong>privadas</strong> só aparecem para você. Seu e-mail nunca é
        mostrado publicamente.
      </p>

      <h2>Por que usamos seus dados (bases legais)</h2>
      <ul>
        <li>Para oferecer sua conta e os recursos que você usa — execução do nosso contrato com você.</li>
        <li>Para manter o Supabox seguro e evitar abusos — nossos interesses legítimos.</li>
        <li>Para enviar e-mails da conta (confirmação, redefinição de senha) — execução do contrato.</li>
        <li>Para cumprir obrigações legais quando necessário.</li>
      </ul>

      <h2>Quem trata seus dados por nós</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — banco de dados, armazenamento de fotos e autenticação.
        </li>
        <li>
          <strong>Vercel</strong> — hospedagem do site.
        </li>
        <li>
          <strong>Resend</strong> — envio dos e-mails da conta.
        </li>
      </ul>
      <p>
        Esses provedores podem guardar dados em servidores fora do seu país, inclusive nos Estados Unidos. Eles tratam os
        dados apenas conforme nossas instruções e sob seus próprios compromissos de segurança e proteção de dados. As
        informações e imagens de jogos vêm do IGDB.com; não compartilhamos seus dados pessoais com o IGDB.
      </p>

      <h2>Por quanto tempo guardamos</h2>
      <p>
        Guardamos seus dados enquanto sua conta existir. Quando você exclui a conta, seu perfil e tudo o que você adicionou
        são apagados do nosso banco de dados imediatamente. Os registros de servidor dos provedores de hospedagem são
        mantidos por tempo limitado, conforme as políticas deles.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode acessar, corrigir, baixar (portabilidade) e excluir seus dados, e pedir informações sobre como eles são
        tratados. A maior parte você mesmo pode fazer:
      </p>
      <ul>
        <li>
          <strong>Corrigir:</strong> edite seu perfil em <Link href="/profile/edit">Editar perfil</Link>.
        </li>
        <li>
          <strong>Baixar:</strong> use &quot;Baixar meus dados&quot; na página{" "}
          <Link href="/profile/edit">Editar perfil</Link>.
        </li>
        <li>
          <strong>Excluir:</strong> use &quot;Excluir minha conta&quot; na mesma página. Não dá para desfazer.
        </li>
      </ul>
      <p>
        Para qualquer outra coisa, ou para se opor ao tratamento ou limitá-lo, escreva para{" "}
        <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>. Procuramos responder em até 15 dias. Você também pode
        reclamar à autoridade de proteção de dados, como a ANPD.
      </p>

      <h2>Crianças</h2>
      <p>
        O Supabox não é destinado a menores de 13 anos (ou da idade mínima exigida no seu país). Se você acredita que uma
        criança criou uma conta, fale com a gente e vamos excluí-la.
      </p>

      <h2>Segurança</h2>
      <p>
        As conexões são criptografadas (HTTPS), as senhas são guardadas como hash pelo nosso provedor de autenticação e as
        regras de acesso ao banco garantem que cada pessoa só altere os próprios dados. Nenhum sistema é perfeitamente
        seguro; se um incidente afetar você, avisaremos você e as autoridades como a lei exige.
      </p>

      <h2>Mudanças</h2>
      <p>
        Se mudarmos esta política de forma relevante, vamos atualizar a data acima e, quando fizer sentido, avisar por
        e-mail ou no site.
      </p>

      <h2>Contato</h2>
      <p>
        {LEGAL_OPERATOR} — <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>
      </p>
    </LegalPage>
  );
}

function PrivacyEn() {
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
          <strong>What you add to Supabox:</strong> your library and Want to Play list, ratings, reviews, diary entries,
          lists, favorite games, profile picture, likes, comments and who you follow.
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
