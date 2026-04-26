const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuth(email: string, password: string) {
  return {
    email: emailPattern.test(email.trim()),
    password: password.length >= 8,
  };
}
