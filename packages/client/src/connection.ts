import { Socket } from "node:net";

const DEFAULT_PORT = 10102;
const DEFAULT_TIMEOUT = 5000;

export class CoolMasterConnection {
  private host: string;
  private port: number;
  private timeout: number;
  private semaphore: Promise<void> = Promise.resolve();

  constructor(host: string, port = DEFAULT_PORT, timeout = DEFAULT_TIMEOUT) {
    this.host = host;
    this.port = port;
    this.timeout = timeout;
  }

  /**
   * Sends a command and returns the parsed response.
   * Commands are serialized via a semaphore since the CoolMasterNet
   * device processes one command at a time.
   */
  async execute(command: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let settled = false;
      const finish = (fn: () => void) => {
        if (!settled) {
          settled = true;
          fn();
        }
      };

      // Chain onto the semaphore so commands execute sequentially
      this.semaphore = this.semaphore
        .then(
          () =>
            new Promise<void>((done) => {
              const socket = new Socket();
              let buffer = "";

              const timer = setTimeout(() => {
                socket.destroy();
                finish(() =>
                  reject(
                    new Error(
                      `Timeout waiting for response to command: ${command}`,
                    ),
                  ),
                );
                done();
              }, this.timeout);

              socket.on("data", (data) => {
                buffer += data.toString("ascii");

                // Wait for the prompt after our command's response
                if (buffer.includes("\n>")) {
                  clearTimeout(timer);
                  socket.destroy();

                  const response = this.parseResponse(buffer);
                  finish(() => resolve(response));
                  done();
                }
              });

              socket.on("error", (err) => {
                clearTimeout(timer);
                finish(() =>
                  reject(
                    new Error(`Connection error: ${err.message}`),
                  ),
                );
                done();
              });

              socket.on("close", () => {
                clearTimeout(timer);
                done();
              });

              socket.connect(this.port, this.host, () => {
                // The device sends a ">" prompt on connect, wait for it then send command
                const waitForPrompt = (chunk: Buffer) => {
                  if (chunk.toString("ascii").includes(">")) {
                    socket.removeListener("data", waitForPrompt);
                    buffer = "";
                    socket.write(command + "\n", "ascii");
                  }
                };
                socket.on("data", waitForPrompt);
              });
            }),
        )
        .catch(() => {
          // Keep semaphore chain alive even on errors
        });
    });
  }

  private parseResponse(raw: string): string {
    let data = raw;

    // Strip trailing prompt
    if (data.endsWith("\n>")) {
      data = data.slice(0, -2);
    }

    // Strip OK suffix (handles both \r\n and \n line endings)
    data = data.replace(/\s*OK\s*$/i, "");

    if (data.includes("Unknown command")) {
      const cmd = data.split(" ")[0] ?? "unknown";
      throw new Error(`Unsupported command: ${cmd}`);
    }

    return data.trim();
  }

  /** Test if the connection works by sending a basic command. */
  async ping(): Promise<boolean> {
    try {
      await this.execute("set");
      return true;
    } catch {
      return false;
    }
  }
}
