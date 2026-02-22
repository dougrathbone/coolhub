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
    .command("lines")
    .description("Show HVAC line diagnostics")
    .action(async () => {
      const client = getClient(program);

      try {
        const lines = await client.lineDiagnostics();

        if (lines.length === 0) {
          console.log(chalk.yellow("No HVAC lines detected"));
          return;
        }

        const table = new Table({
          head: [
            chalk.bold("Line"),
            chalk.bold("Protocol"),
            chalk.bold("Role"),
            chalk.bold("Units"),
            chalk.bold("TX"),
            chalk.bold("RX"),
            chalk.bold("TO"),
            chalk.bold("CS"),
            chalk.bold("Col"),
            chalk.bold("NAK"),
          ],
        });

        for (const line of lines) {
          table.push([
            line.line,
            line.protocol,
            line.role,
            line.unitCounts,
            line.tx,
            line.rx,
            line.timeouts === "0/0" ? chalk.green(line.timeouts) : chalk.yellow(line.timeouts),
            line.checksumErrors === "0/0" ? chalk.green(line.checksumErrors) : chalk.red(line.checksumErrors),
            line.collisions === "0/0" ? chalk.green(line.collisions) : chalk.yellow(line.collisions),
            line.naks === "0/0" ? chalk.green(line.naks) : chalk.red(line.naks),
          ]);
        }

        console.log(chalk.bold.cyan("HVAC Line Diagnostics"));
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
