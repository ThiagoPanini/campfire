export const seededUser = {
  displayName: "Ada",
  email: "ada@campfire.test",
  password: "campfire123",
};

export function displayNameFromEmail(email: string) {
  const local = email.split("@")[0] || "Member";
  return local
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Member";
}
