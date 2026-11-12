import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { LEGAL_CONTACT, LEGAL_OPERATOR, LegalPage } from "@/components/legal/legal-page";

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const { locale } = await getT(params);
  return locale === "pt-BR"
    ? { title: "Termos de Uso", description: "As regras para usar o Supabox." }
    : { title: "Terms of Service", description: "The rules for using Supabox." };
}

export default async function TermsPage({ params }: PageProps<"/[lang]/terms">) {
  const { locale } = await getT(params);
  return locale === "pt-BR" ? <TermsPt /> : <TermsEn />;
}

function TermsPt() {
  return (
    <LegalPage title="Termos de Uso" updated="12 de novembro de 2026" updatedLabel="Última atualização:">
      <p>
        Estes termos se aplicam ao uso do Supabox em supaboxd.com, operado por {LEGAL_OPERATOR}. Ao criar uma conta ou usar
        o Supabox, você concorda com eles. Se não concordar, por favor não use o Supabox. O Supabox está em acesso
        antecipado (beta), então os recursos podem mudar e, de vez em quando, algo pode falhar.
      </p>

      <h2>Sua conta</h2>
      <ul>
        <li>Você precisa ter pelo menos 13 anos (ou a idade mínima do seu país) para criar uma conta.</li>
        <li>Guarde bem sua senha; você é responsável pelo que acontece na sua conta.</li>
        <li>Escolha um nome de usuário que não se passe por outra pessoa nem viole direitos de ninguém.</li>
      </ul>

      <h2>Seu conteúdo</h2>
      <p>
        As reviews, listas, comentários e outros conteúdos que você publica são seus. Você dá ao Supabox uma licença não
        exclusiva, mundial e gratuita para armazenar, exibir e distribuir esse conteúdo no Supabox, para que o serviço
        funcione (por exemplo, mostrar suas reviews para outras pessoas). Essa licença termina quando você apaga o conteúdo
        ou a sua conta.
      </p>

      <h2>Regras da comunidade</h2>
      <p>Não use o Supabox para:</p>
      <ul>
        <li>assediar, ameaçar ou intimidar outras pessoas, ou publicar conteúdo de ódio ou sexualmente explícito;</li>
        <li>publicar spam, golpes, malware ou conteúdo que você não tem direito de compartilhar;</li>
        <li>expor informações privadas de outras pessoas;</li>
        <li>violar a lei, ou tentar quebrar, sobrecarregar ou acessar o Supabox sem autorização;</li>
        <li>copiar ou baixar dados do Supabox em massa sem permissão.</li>
      </ul>
      <p>Marque como contendo spoilers as reviews que revelam detalhes da história.</p>
      <p>
        Podemos remover conteúdo ou suspender contas que violem essas regras. Se você vir algo assim, escreva para{" "}
        <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>.
      </p>

      <h2>Informações dos jogos</h2>
      <p>
        Dados, capas e logos de jogos são fornecidos pelo IGDB.com e pertencem aos seus respectivos donos. As notas da
        crítica são médias de análises publicadas. O Supabox não tem vínculo com nenhuma publicadora ou plataforma.
      </p>

      <h2>Encerrando sua conta</h2>
      <p>
        Você pode excluir sua conta a qualquer momento em <Link href="/profile/edit">Editar perfil</Link>. Podemos suspender
        ou encerrar contas que violem estes termos de forma grave ou repetida.
      </p>

      <h2>Isenções</h2>
      <p>
        O Supabox é oferecido &quot;como está&quot;, sem garantias de qualquer tipo, na medida permitida pela lei. Não
        respondemos por perdas indiretas ou consequentes, nem por conteúdo publicado por usuários. Nada nestes termos limita
        direitos que você tem como consumidor e que não podem ser limitados por contrato, inclusive os do Código de Defesa
        do Consumidor.
      </p>

      <h2>Mudanças</h2>
      <p>
        Podemos atualizar estes termos. Se as mudanças forem relevantes, avisaremos no site ou por e-mail antes de entrarem
        em vigor. Continuar usando o Supabox depois disso significa aceitar os novos termos.
      </p>

      <h2>Contato</h2>
      <p>
        {LEGAL_OPERATOR} — <a href={`mailto:${LEGAL_CONTACT}`}>{LEGAL_CONTACT}</a>. Veja também nossa{" "}
        <Link href="/privacy">Política de Privacidade</Link>.
      </p>
    </LegalPage>
  );
}

function TermsEn() {
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
