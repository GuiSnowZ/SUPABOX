/**
 * Emails Supabox sends itself (through Resend). Same look as the Supabase
 * Auth templates in supabase/templates: dark card, logo, green button.
 */

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const C = { bg: "#0b0c0e", card: "#16191c", border: "#262a2f", text: "#f2f4f5", muted: "#a9b0b6", faint: "#6f777e", accent: "#7dd59a", accentText: "#0c0d10" };

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const p = (size: number, color: string, margin: string, body: string) =>
  `<p style="margin:${margin};font-family:${FONT};font-size:${size}px;line-height:1.55;color:${color};">${body}</p>`;

function layout({ hello, title, intro, button, link, extra = "", fallback, note, footer }: {
  hello: string; title: string; intro: string; button: string; link: string; extra?: string; fallback: string; note: string; footer: string;
}): string {
  const href = escapeHtml(link);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><title>Supabox</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
<tr><td style="padding:0 4px 24px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="vertical-align:middle;"><img src="https://supaboxd.com/brand/supabox-mark-128.png" width="36" height="36" alt="" style="display:block;border:0;"></td>
<td style="vertical-align:middle;padding-left:10px;font-family:${FONT};font-size:24px;font-weight:700;letter-spacing:-0.5px;color:${C.text};">supabox</td>
</tr></table></td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:32px 28px;">
${p(15, C.muted, "0 0 6px", hello)}
<h1 style="margin:0 0 14px;font-family:${FONT};font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.4px;color:${C.text};">${title}</h1>
${p(15, C.muted, "0 0 26px", intro)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:10px;background:${C.accent};">
<a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:16px;font-weight:700;color:${C.accentText};text-decoration:none;border-radius:10px;">${button}</a>
</td></tr></table>
${extra}
${p(13, C.faint, "26px 0 6px", fallback)}
<p style="margin:0 0 22px;font-family:${FONT};font-size:12px;line-height:1.5;word-break:break-all;"><a href="${href}" style="color:${C.accent};text-decoration:underline;">${href}</a></p>
${p(13, C.faint, "0", note)}
</td></tr>
<tr><td style="padding:22px 4px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.faint};">
<span style="color:${C.muted};font-weight:600;">Supabox</span> — ${footer}<br><a href="https://supaboxd.com" style="color:${C.faint};text-decoration:underline;">supaboxd.com</a>
</td></tr></table></td></tr></table></body></html>`;
}

/** "Confirm your email" for an account that's already in use. */
export function verificationEmail({ link, name, locale }: { link: string; name: string; locale: "pt-BR" | "en" }) {
  const who = name.trim() ? escapeHtml(name.trim().slice(0, 50)) : "";
  if (locale === "en") {
    return {
      subject: "Confirm your email · Supabox",
      html: layout({
        hello: who ? `Hi, ${who}!` : "Hi!",
        title: "Confirm your email",
        intro: "Welcome to Supabox! Your account is ready to use. Confirm this email so you can comment and always recover your account.",
        button: "Confirm my email",
        link,
        extra: p(14, C.muted, "22px 0 0", "🎮&nbsp; Log what you play<br>⭐&nbsp; Rate and review games<br>📋&nbsp; Make your own lists<br>👥&nbsp; See what your friends are playing"),
        fallback: "If the button doesn't work, copy and paste this link into your browser:",
        note: "This link works for 7 days. If you didn't create a Supabox account, you can safely ignore this email.",
        footer: "Your games. Your story.",
      }),
    };
  }
  return {
    subject: "Confirme seu e-mail · Supabox",
    html: layout({
      hello: who ? `Olá, ${who}!` : "Olá!",
      title: "Confirme seu e-mail",
      intro: "Boas-vindas ao Supabox! Sua conta já está funcionando. Confirme este e-mail para poder comentar e sempre conseguir recuperar sua conta.",
      button: "Confirmar meu e-mail",
      link,
      extra: p(14, C.muted, "22px 0 0", "🎮&nbsp; Registre o que você joga<br>⭐&nbsp; Dê notas e escreva reviews<br>📋&nbsp; Crie suas listas<br>👥&nbsp; Veja o que seus amigos estão jogando"),
      fallback: "Se o botão não funcionar, copie e cole este link no navegador:",
      note: "O link vale por 7 dias. Se você não criou uma conta no Supabox, pode ignorar este e-mail com segurança.",
      footer: "Seus jogos. Sua história.",
    }),
  };
}
