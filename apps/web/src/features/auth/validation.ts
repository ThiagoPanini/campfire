const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const commonPasswords = new Set([
  "password",
  "password1",
  "password123",
  "1234567890",
  "qwerty123",
  "letmein123",
  "admin123",
  "campfire123",
]);

export function passwordChecks(password: string) {
  const classes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  return [
    { key: "length", ok: password.length >= 10 },
    { key: "classes", ok: classes >= 3 },
    { key: "common", ok: !commonPasswords.has(password.trim().toLowerCase()) },
  ];
}

function validateEmail(email: string) {
  return email === email.trim() && email.length >= 3 && email.length <= 320 && emailPattern.test(email);
}

export function validateSignIn(email: string, password: string) {
  return {
    email: validateEmail(email),
    password: password.length > 0,
  };
}

export function validateSignUp(email: string, password: string) {
  return {
    email: validateEmail(email),
    password: passwordChecks(password).every((check) => check.ok),
  };
}
