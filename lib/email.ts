import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const subjects: Record<string, string> = {
  en: "Verify your email — Hold'em Sense",
  de: "E-Mail bestätigen — Hold'em Sense",
  es: "Verifica tu correo — Hold'em Sense",
  pt: "Verifique o seu e-mail — Hold'em Sense",
};

function verificationBody(url: string, locale: string): string {
  switch (locale) {
    case "de":
      return `<p>Klicke auf den Link, um deine E-Mail-Adresse zu bestätigen:</p><p><a href="${url}">E-Mail bestätigen</a></p><p>Dieser Link ist 24 Stunden gültig.</p>`;
    case "es":
      return `<p>Haz clic en el enlace para verificar tu correo electrónico:</p><p><a href="${url}">Verificar correo</a></p><p>Este enlace expira en 24 horas.</p>`;
    case "pt":
      return `<p>Clique no link abaixo para verificar o seu e-mail:</p><p><a href="${url}">Verificar e-mail</a></p><p>Este link expira em 24 horas.</p>`;
    default:
      return `<p>Click the link below to verify your email address:</p><p><a href="${url}">Verify email</a></p><p>This link expires in 24 hours.</p>`;
  }
}

const resetSubjects: Record<string, string> = {
  en: "Reset your password — Hold'em Sense",
  de: "Passwort zurücksetzen — Hold'em Sense",
  es: "Restablece tu contraseña — Hold'em Sense",
  pt: "Redefinir a sua palavra-passe — Hold'em Sense",
};

function resetPasswordBody(url: string, locale: string): string {
  switch (locale) {
    case "de":
      return `<p>Klicke auf den Link, um dein Passwort zurückzusetzen:</p><p><a href="${url}">Passwort zurücksetzen</a></p><p>Dieser Link ist 1 Stunde gültig.</p>`;
    case "es":
      return `<p>Haz clic en el enlace para restablecer tu contraseña:</p><p><a href="${url}">Restablecer contraseña</a></p><p>Este enlace expira en 1 hora.</p>`;
    case "pt":
      return `<p>Clique no link abaixo para redefinir a sua palavra-passe:</p><p><a href="${url}">Redefinir palavra-passe</a></p><p>Este link expira em 1 hora.</p>`;
    default:
      return `<p>Click the link below to reset your password:</p><p><a href="${url}">Reset password</a></p><p>This link expires in 1 hour.</p>`;
  }
}

export async function sendPasswordResetEmail(email: string, token: string, locale: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/reset-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: "Hold'em Sense <noreply@holdemsense.com>",
    to: email,
    subject: resetSubjects[locale] ?? resetSubjects.en,
    html: resetPasswordBody(url, locale),
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message);
  }
}

export async function sendVerificationEmail(email: string, token: string, locale: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/api/verify-email?token=${token}`;

  const { error } = await resend.emails.send({
    from: "Hold'em Sense <noreply@holdemsense.com>",
    to: email,
    subject: subjects[locale] ?? subjects.en,
    html: verificationBody(url, locale),
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message);
  }
}
