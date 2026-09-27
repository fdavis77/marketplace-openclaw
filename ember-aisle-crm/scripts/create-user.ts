/**
 * Create or reset a staff login.
 *   npm run user:create -- --person fabian --name "Fabian" --email fabian@example.com
 * The password is prompted for (not passed as an argument, so it never
 * lands in shell history).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";

function promptHidden(question: string): Promise<string> {
  if (process.env.EA_PASSWORD) return Promise.resolve(process.env.EA_PASSWORD);
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      if (s.includes(question)) write.call(rl, s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const { values } = parseArgs({
    options: { person: { type: "string" }, name: { type: "string" }, email: { type: "string" } },
  });
  const person = values.person;
  if (person !== "fabian" && person !== "davinia") throw new Error("--person must be fabian or davinia");
  if (!values.name || !values.email) throw new Error("--name and --email are required");

  const password = await promptHidden("Password (min 12 characters): ");
  if (password.length < 12) throw new Error("Password must be at least 12 characters");

  const hash = await bcrypt.hash(password, 12);
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
  await sql`
    insert into users (name, email, password_hash, person)
    values (${values.name}, ${values.email.trim().toLowerCase()}, ${hash}, ${person})
    on conflict (person) do update
      set name = excluded.name, email = excluded.email,
          password_hash = excluded.password_hash, updated_at = now()`;
  await sql.end();
  console.log(`Login saved for ${person}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
