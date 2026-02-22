import { Command } from "commander";
import { CoolMasterClient } from "@coolhub/client";
import Table from "cli-table3";
import chalk from "chalk";

function getClient(program: Command) {
  const opts = program.opts() as { host: string; port: string };
  return new CoolMasterClient({
    host: opts.host,
    port: parseInt(opts.port, 10),
  });
}

export function registerSystemCommand(program: Command) {
  program
    .command("info")
    .description("Show CoolMasterNet bridge system info")
    .action(async () => {
      const client = getClient(program);

      try {
        const info = await client.info();
        const table = new Table();

        for (const [key, value] of Object.entries(info)) {
          table.push({ [chalk.bold(key)]: value });
        }

        console.log(chalk.bold.cyan("CoolMasterNet System Info"));
        console.log(table.toString());
      } catch (err) {
        console.error(
          chalk.red("Error:"),
          err instanceof Error ? err.message : err,
        );
        process.exit(1);
      }
    });

  program
    .command("ping")
    .description("Test connectivity to CoolMasterNet")
    .action(async () => {
      const client = getClient(program);
      const opts = program.opts() as { host: string; port: string };

      try {
        const ok = await client.ping();
        if (ok) {
          console.log(
            chalk.green(`Connected to CoolMasterNet at ${opts.host}:${opts.port}`),
          );
        } else {
          console.log(
            chalk.red(`Could not connect to CoolMasterNet at ${opts.host}:${opts.port}`),
          );
          process.exit(1);
        }
      } catch (err) {
        console.error(
          chalk.red("Connection failed:"),
          err instanceof Error ? err.message : err,
        );
        process.exit(1);
      }
    });
}
