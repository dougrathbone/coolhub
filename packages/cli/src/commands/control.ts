import { Command } from "commander";
import {
  CoolMasterClient,
  MODES,
  FAN_SPEEDS,
  type Mode,
  type FanSpeed,
} from "@coolhub/client";
import chalk from "chalk";

function getClient(program: Command) {
  const opts = program.opts() as { host: string; port: string };
  return new CoolMasterClient({
    host: opts.host,
    port: parseInt(opts.port, 10),
  });
}

export function registerControlCommand(program: Command) {
  program
    .command("on")
    .description("Turn a unit on")
    .argument("<uid>", "Unit UID (e.g. L1.101)")
    .action(async (uid: string) => {
      const client = getClient(program);
      await client.turnOn(uid);
      console.log(chalk.green(`${uid} turned ON`));
    });

  program
    .command("off")
    .description("Turn a unit off")
    .argument("<uid>", "Unit UID (e.g. L1.101)")
    .action(async (uid: string) => {
      const client = getClient(program);
      await client.turnOff(uid);
      console.log(chalk.yellow(`${uid} turned OFF`));
    });

  program
    .command("set")
    .description("Set unit parameters")
    .argument("<uid>", "Unit UID (e.g. L1.101)")
    .option("-t, --temp <temperature>", "Set target temperature")
    .option(
      `-m, --mode <mode>`,
      `Set mode (${MODES.join(", ")})`,
    )
    .option(
      `-f, --fan <speed>`,
      `Set fan speed (${FAN_SPEEDS.join(", ")})`,
    )
    .action(
      async (
        uid: string,
        opts: { temp?: string; mode?: string; fan?: string },
      ) => {
        const client = getClient(program);
        const actions: string[] = [];

        if (opts.mode) {
          await client.setMode(uid, opts.mode as Mode);
          actions.push(`mode=${opts.mode}`);
        }

        if (opts.temp) {
          await client.setTemperature(uid, parseFloat(opts.temp));
          actions.push(`temp=${opts.temp}`);
        }

        if (opts.fan) {
          await client.setFanSpeed(uid, opts.fan as FanSpeed);
          actions.push(`fan=${opts.fan}`);
        }

        if (actions.length === 0) {
          console.log(chalk.yellow("No settings specified. Use --temp, --mode, or --fan"));
        } else {
          console.log(chalk.green(`${uid}: ${actions.join(", ")}`));
        }
      },
    );
}
