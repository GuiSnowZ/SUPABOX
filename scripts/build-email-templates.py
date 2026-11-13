#!/usr/bin/env python3
# Run: python3 scripts/build-email-templates.py  (writes supabase/templates/*.html)
"""Generates Supabox's Supabase Auth email templates (Go templates, inline styles)."""
import os
OUT = os.path.join(os.path.dirname(__file__), "..", "supabase", "templates")
BG, CARD, BORDER, TEXT, MUTED, FAINT, ACCENT, ACCENT_TEXT = "#0b0c0e", "#16191c", "#262a2f", "#f2f4f5", "#a9b0b6", "#6f777e", "#7dd59a", "#0c0d10"
FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

def lang(pt, en):
    """Portuguese by default; English when the account was created in English."""
    return '{{ if eq .Data.locale "en" }}' + en + '{{ else }}' + pt + '{{ end }}'

def hello():
    return lang('{{ if .Data.display_name }}Olá, {{ .Data.display_name }}!{{ else }}Olá!{{ end }}',
                '{{ if .Data.display_name }}Hi, {{ .Data.display_name }}!{{ else }}Hi!{{ end }}')

def page(title_pt, title_en, intro_pt, intro_en, button_pt, button_en, url, note_pt, note_en, extra=""):
    p = lambda size, color, margin="0 0 16px": f'style="margin:{margin};font-family:{FONT};font-size:{size}px;line-height:1.55;color:{color};"'
    return f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Supabox</title>
</head>
<body style="margin:0;padding:0;background:{BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{BG};">
<tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
    <tr><td style="padding:0 4px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;"><img src="https://supaboxd.com/brand/supabox-mark-128.png" width="36" height="36" alt="" style="display:block;border:0;"></td>
        <td style="vertical-align:middle;padding-left:10px;font-family:{FONT};font-size:24px;font-weight:700;letter-spacing:-0.5px;color:{TEXT};">supabox</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:{CARD};border:1px solid {BORDER};border-radius:16px;padding:32px 28px;">
      <p {p(15, MUTED, "0 0 6px")}>{hello()}</p>
      <h1 style="margin:0 0 14px;font-family:{FONT};font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-0.4px;color:{TEXT};">{lang(title_pt, title_en)}</h1>
      <p {p(15, MUTED, "0 0 26px")}>{lang(intro_pt, intro_en)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="border-radius:10px;background:{ACCENT};">
          <a href="{url}" style="display:inline-block;padding:14px 26px;font-family:{FONT};font-size:16px;font-weight:700;color:{ACCENT_TEXT};text-decoration:none;border-radius:10px;">{lang(button_pt, button_en)}</a>
        </td>
      </tr></table>
      {extra}
      <p {p(13, FAINT, "26px 0 6px")}>{lang("Se o botão não funcionar, copie e cole este link no navegador:", "If the button doesn't work, copy and paste this link into your browser:")}</p>
      <p style="margin:0 0 22px;font-family:{FONT};font-size:12px;line-height:1.5;word-break:break-all;"><a href="{url}" style="color:{ACCENT};text-decoration:underline;">{url}</a></p>
      <p {p(13, FAINT, "0")}>{lang(note_pt, note_en)}</p>
    </td></tr>
    <tr><td style="padding:22px 4px 0;font-family:{FONT};font-size:12px;line-height:1.6;color:{FAINT};">
      <span style="color:{MUTED};font-weight:600;">Supabox</span> — {lang("Seus jogos. Sua história.", "Your games. Your story.")}<br>
      <a href="https://supaboxd.com" style="color:{FAINT};text-decoration:underline;">supaboxd.com</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
'''

templates = {
  "confirmation": page(
    "Confirme seu e-mail", "Confirm your email",
    "Falta só um passo para começar seu diário de jogos no Supabox. Confirme este e-mail para ativar sua conta.",
    "One step left to start your gaming diary on Supabox. Confirm this email to activate your account.",
    "Confirmar meu e-mail", "Confirm my email", "{{ .ConfirmationURL }}",
    "Se você não criou uma conta no Supabox, pode ignorar este e-mail com segurança.",
    "If you didn't create a Supabox account, you can safely ignore this email.",
    extra='<p style="margin:22px 0 0;font-family:%s;font-size:14px;line-height:1.6;color:%s;">%s</p>' % (FONT, MUTED, lang(
      "🎮&nbsp; Registre o que você joga<br>⭐&nbsp; Dê notas e escreva reviews<br>📋&nbsp; Crie suas listas<br>👥&nbsp; Veja o que seus amigos estão jogando",
      "🎮&nbsp; Log what you play<br>⭐&nbsp; Rate and review games<br>📋&nbsp; Make your own lists<br>👥&nbsp; See what your friends are playing"))),
  "recovery": page(
    "Redefina sua senha", "Reset your password",
    "Recebemos um pedido para criar uma nova senha para a sua conta no Supabox. Toque no botão abaixo para escolher a nova senha.",
    "We got a request to set a new password for your Supabox account. Tap the button below to choose a new one.",
    "Criar nova senha", "Choose a new password", "{{ .ConfirmationURL }}",
    "Não pediu isso? Pode ignorar este e-mail: sua senha continua a mesma.",
    "Didn't ask for this? You can ignore this email: your password stays the same."),
  "email_change": page(
    "Confirme seu novo e-mail", "Confirm your new email",
    "Você pediu para trocar o e-mail da sua conta no Supabox para <strong style=\"color:%s;\">{{ .NewEmail }}</strong>. Confirme para concluir a troca." % TEXT,
    "You asked to change your Supabox account email to <strong style=\"color:%s;\">{{ .NewEmail }}</strong>. Confirm to finish the change." % TEXT,
    "Confirmar novo e-mail", "Confirm new email", "{{ .ConfirmationURL }}",
    "Se não foi você, ignore este e-mail e troque sua senha.",
    "If this wasn't you, ignore this email and change your password."),
  "magic_link": page(
    "Seu link para entrar", "Your sign-in link",
    "Use o botão abaixo para entrar na sua conta do Supabox.",
    "Use the button below to sign in to your Supabox account.",
    "Entrar no Supabox", "Sign in to Supabox", "{{ .ConfirmationURL }}",
    "Se você não pediu este link, pode ignorar este e-mail.",
    "If you didn't ask for this link, you can ignore this email."),
}
SUBJECTS = {
  "confirmation": "Confirme seu e-mail no Supabox · Confirm your email",
  "recovery": "Redefinir sua senha do Supabox · Reset your password",
  "email_change": "Confirme seu novo e-mail · Confirm your new email",
  "magic_link": "Seu link para entrar no Supabox · Your sign-in link",
}
for name, html in templates.items():
    open(f"{OUT}/{name}.html", "w").write(html)
open(f"{OUT}/README.md", "w").write("""# Supabase Auth email templates

Branded emails for Supabase Auth (Dashboard → Authentication → Emails → Templates).
Go templates: `{{ .ConfirmationURL }}`, `{{ .NewEmail }}`, `{{ .Data.* }}` (user metadata).
Text is Portuguese by default and English when the account's `locale` metadata is "en"
(set at sign-up and when the user switches language).

| Template | File | Subject |
|---|---|---|
""" + "".join(f"| {n} | `{n}.html` | {s} |\n" for n, s in SUBJECTS.items()) + """
These files are the source of truth: edit here, then paste into the dashboard.
""")
print("written", list(templates))
