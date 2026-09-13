export function required(name: string, ...aliases: string[]): string {
  const names = [name, ...aliases];
  const value = names
    .map((candidate) => process.env[candidate])
    .find((candidate): candidate is string => Boolean(candidate));
  if (!value) {
    throw new Error(
      [
        `Missing required environment variable: ${names.join(" or ")}.`,
        "",
        "  Add the missing value to the root `.env` file,",
        "  run `npm run channel:setup` to configure Slack or Teams,",
        "  or `npm run dev:web` to try the browser template instead.",
      ].join("\n"),
    );
  }
  return value;
}
