import type { Locale } from "./config";

/**
 * Portuguese versions of messages produced by the logic layer (validation,
 * database, auth). Components show those messages through FormError and toasts,
 * which pass them through `translateMessage`; unknown messages are shown as-is.
 */
const EXACT_PT: Record<string, string> = {
  "You need to sign in first.": "Você precisa entrar primeiro.",
  "Email or password is incorrect.": "E-mail ou senha incorretos.",
  "Please confirm your email first — check your inbox for the link.": "Confirme seu e-mail primeiro — procure o link na sua caixa de entrada.",
  "An account with this email already exists. Try signing in.": "Já existe uma conta com este e-mail. Tente entrar.",
  "Too many attempts. Please wait a minute and try again.": "Muitas tentativas. Espere um minuto e tente de novo.",
  "That username can't be used. Try another one.": "Esse nome de usuário não pode ser usado. Tente outro.",
  "Supabox isn't connected to its database yet.": "O Supabox ainda não está conectado ao banco de dados.",
  "Usernames are 3–30 characters: lowercase letters, numbers and underscores.": "Nomes de usuário têm de 3 a 30 caracteres: letras minúsculas, números e sublinhados.",
  "Ratings go from 0.5 to 5 stars in half-star steps.": "As notas vão de 0,5 a 5 estrelas, de meia em meia.",
  "Add a rating, some text, or both.": "Dê uma nota, escreva algo, ou os dois.",
  "That already exists.": "Isso já existe.",
  "You don't have permission to do that.": "Você não tem permissão para fazer isso.",
  "You're commenting too fast. Please wait a moment.": "Você está comentando rápido demais. Espere um pouco.",
  "Sign in first.": "Entre na sua conta primeiro.",
  "An account with this email already exists.": "Já existe uma conta com este e-mail.",
  "Enter a valid email address.": "Digite um e-mail válido.",
  "Your email is already confirmed.": "Seu e-mail já está confirmado.",
  "Couldn't change the email. Try again.": "Não foi possível trocar o e-mail. Tente de novo.",
  "Couldn't send the email right now. Try again later.": "Não foi possível enviar o e-mail agora. Tente mais tarde.",
  "That value isn't allowed.": "Esse valor não é permitido.",
  "Couldn't reach Supabox. Check your connection and try again.": "Não foi possível conectar ao Supabox. Verifique sua conexão e tente de novo.",
  "You can only delete your own reviews.": "Você só pode excluir suas próprias reviews.",
  "Pick a start date.": "Escolha a data de início.",
  "The finish date can't be before the start date.": "A data de término não pode ser antes da data de início.",
  "Hours played must be between 0 and 10,000.": "As horas jogadas devem estar entre 0 e 10.000.",
  "You can only delete your own diary entries.": "Você só pode excluir suas próprias entradas do diário.",
  "Give your list a title.": "Dê um título à sua lista.",
  "List not found.": "Lista não encontrada.",
  "You can only edit your own lists.": "Você só pode editar suas próprias listas.",
  "You can only delete your own lists.": "Você só pode excluir suas próprias listas.",
  "Favorites must be games you've completed and rated.": "Os favoritos precisam ser jogos que você zerou e avaliou.",
  "favorites must be games you completed and rated": "Os favoritos precisam ser jogos que você zerou e avaliou.",
  "Follow them first to get notifications.": "Siga a pessoa primeiro para receber notificações.",
  "You can't follow yourself.": "Você não pode seguir a si mesmo.",
  "Display name can't be empty.": "O nome de exibição não pode ficar vazio.",
  "Display name can be at most 50 characters.": "O nome de exibição pode ter no máximo 50 caracteres.",
  "Bio can be at most 300 characters.": "A bio pode ter no máximo 300 caracteres.",
  "Your browser can't process images.": "Seu navegador não consegue processar imagens.",
  "Your browser couldn't convert that image. Try a JPG or PNG.": "Seu navegador não conseguiu converter essa imagem. Tente um JPG ou PNG.",
  "That image is too detailed to shrink. Try another one.": "Essa imagem é detalhada demais para reduzir. Tente outra.",
  "Choose an image file (JPG, PNG, WebP…).": "Escolha um arquivo de imagem (JPG, PNG, WebP…).",
  "That image is over 15 MB. Choose a smaller one.": "Essa imagem tem mais de 15 MB. Escolha uma menor.",
  "Couldn't upload the picture. Please try again.": "Não foi possível enviar a foto. Tente de novo.",
  "Couldn't read that image.": "Não foi possível ler essa imagem.",
  "Something went wrong.": "Algo deu errado.",
  "Something went wrong. Please try again.": "Algo deu errado. Tente de novo.",
  "Couldn't load notifications.": "Não foi possível carregar as notificações.",
  "Couldn't load your settings.": "Não foi possível carregar suas configurações.",
  "Couldn't save.": "Não foi possível salvar.",
  "Search failed.": "A busca falhou.",
  "only the notification setting of a follow can be changed": "Só a configuração de notificação pode ser alterada.",
  "you can pick up to 5 favorite games": "Você pode escolher até 5 jogos favoritos.",
  "each favorite can appear only once": "Cada favorito só pode aparecer uma vez.",
};

const PATTERNS_PT: Array<[RegExp, (...m: string[]) => string]> = [
  [/^Passwords need at least (\d+) characters\.$/, (_, n) => `A senha precisa ter pelo menos ${n} caracteres.`],
  [/^@(\S+) is taken\. Try another username\.$/, (_, u) => `@${u} já está em uso. Tente outro nome de usuário.`],
  [/^Reviews can be at most (\d+) characters\.$/, (_, n) => `Reviews podem ter no máximo ${n} caracteres.`],
  [/^Titles can be at most (\d+) characters\.$/, (_, n) => `Títulos podem ter no máximo ${n} caracteres.`],
  [/^Descriptions can be at most (\d+) characters\.$/, (_, n) => `Descrições podem ter no máximo ${n} caracteres.`],
  [/^Lists can hold at most (\d+) games\.$/, (_, n) => `Listas podem ter no máximo ${n} jogos.`],
  [/^You can pick up to (\d+) favorite games\.$/, (_, n) => `Você pode escolher até ${n} jogos favoritos.`],
];

export function translateMessage(message: string, locale: Locale): string {
  if (locale !== "pt-BR") return message;
  if (EXACT_PT[message]) return EXACT_PT[message];
  for (const [re, fn] of PATTERNS_PT) {
    const m = re.exec(message);
    if (m) return fn(...m);
  }
  return message;
}
