import { spawn } from "node:child_process";

const commands = [
  ["npm", ["run", "dev:api"]],
  ["npm", ["run", "dev:web"]]
];

const children = commands.map(([command, args]) => {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      for (const other of children) other.kill();
      process.exit(code);
    }
  });

  return child;
});

process.on("SIGINT", () => {
  for (const child of children) child.kill();
  process.exit(0);
});
