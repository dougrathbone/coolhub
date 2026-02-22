#!/usr/bin/env node
import { Command } from "commander";
import { registerStatusCommand } from "./commands/status.js";
import { registerControlCommand } from "./commands/control.js";
import { registerSystemCommand } from "./commands/system.js";

const program = new Command();

program
  .name("coolhub")
  .description("CoolHub CLI - Control CoolMasterNet HVAC systems")
  .version("1.0.0")
  .option("-H, --host <host>", "CoolMasterNet host", "192.168.1.100")
  .option("-p, --port <port>", "CoolMasterNet port", "10102");

registerStatusCommand(program);
registerControlCommand(program);
registerSystemCommand(program);

program.parse();
