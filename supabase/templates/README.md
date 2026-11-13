# Supabase Auth email templates

Branded emails for Supabase Auth (Dashboard → Authentication → Emails → Templates).
Go templates: `{{ .ConfirmationURL }}`, `{{ .NewEmail }}`, `{{ .Data.* }}` (user metadata).
Text is Portuguese by default and English when the account's `locale` metadata is "en"
(set at sign-up and when the user switches language).

| Template | File | Subject |
|---|---|---|
| confirmation | `confirmation.html` | Confirme seu e-mail no Supabox · Confirm your email |
| recovery | `recovery.html` | Redefinir sua senha do Supabox · Reset your password |
| email_change | `email_change.html` | Confirme seu novo e-mail · Confirm your new email |
| magic_link | `magic_link.html` | Seu link para entrar no Supabox · Your sign-in link |

These files are the source of truth: edit here, then paste into the dashboard.
