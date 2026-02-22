import { Command } from "commander";
import { CoolMasterClient } from "@coolhub/client";
import Table from "cli-table3";
import chalk from "chalk";

function getClient(opts: { host: string; port: string }) {
  return new CoolMasterClient({
    host: opts.host,
    port: parseInt(opts.port, 10),
  });
}

function modeColor(mode: string): string {
  switch (mode) {
    case "cool":
      return chalk.cyan(mode);
    case "heat":
      return chalk.red(mode);
    case "dry":
      return chalk.yellow(mode);
    case "fan":
      return chalk.green(mode);
    case "auto":
      return chalk.magenta(mode);
    default:
      return mode;
  }
}

export function registerStatusCommand(program: Command) {
  program
    .command("status")
    .alias("ls")
    .description("Show status of all HVAC units")
    .argument("[uid]", "Specific unit UID (e.g. L1.101)")
    .action(async (uid: string | undefined) => {
      const opts = program.opts() as { host: string; port: string };
      const client = getClient(opts);

      try {
        if (uid) {
          const unit = await client.unitStatus(uid);
          const table = new Table();
          table.push(
            { UID: unit.uid },
            { Power: unit.isOn ? chalk.green("ON") : chalk.gray("OFF") },
            { Mode: modeColor(unit.mode) },
            { "Set Temp": `${unit.thermostat}°${unit.temperatureUnit === "celsius" ? "C" : "F"}` },
            { "Current Temp": `${unit.temperature}°${unit.temperatureUnit === "celsius" ? "C" : "F"}` },
            { "Fan Speed": unit.fanSpeed },
            { Error: unit.errorCode ?? chalk.green("None") },
            { "Filter Clean": unit.cleanFilter ? chalk.yellow("Yes") : chalk.green("No") },
          );
          console.log(table.toString());
        } else {
          const units = await client.status();
          const table = new Table({
            head: [
              chalk.bold("UID"),
              chalk.bold("Power"),
              chalk.bold("Mode"),
              chalk.bold("Set"),
              chalk.bold("Current"),
              chalk.bold("Fan"),
              chalk.bold("Error"),
              chalk.bold("Filter"),
            ],
          });

          for (const unit of units.values()) {
            const suffix = unit.temperatureUnit === "celsius" ? "°C" : "°F";
            table.push([
              unit.uid,
              unit.isOn ? chalk.green("ON") : chalk.gray("OFF"),
              modeColor(unit.mode),
              `${unit.thermostat}${suffix}`,
              `${unit.temperature}${suffix}`,
              unit.fanSpeed,
              unit.errorCode ?? chalk.green("OK"),
              unit.cleanFilter ? chalk.yellow("!") : "-",
            ]);
          }

          console.log(table.toString());
          console.log(chalk.dim(`${units.size} unit(s) found`));
        }
      } catch (err) {
        console.error(
          chalk.red("Error:"),
          err instanceof Error ? err.message : err,
        );
        process.exit(1);
      }
    });
}
