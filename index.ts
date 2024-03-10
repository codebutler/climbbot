import * as cmd from "cmd-ts";
import { serve } from "bun";
import * as dc from "discord-hono";
import { bunCryptoFix } from "./bun-crypto-fix";
import { pluralize } from "./utils";

bunCryptoFix();

interface Gym {
  name: string;
  getClimberCount: () => Promise<number>;
}

interface CommandWithHandler {
  command: dc.Command;
  handler: (context: dc.CommandContext) => Promise<Response>;
}

const gyms: { [gymId: string]: Gym } = {
  "vital-brooklyn": {
    name: "Vital Brooklyn",
    getClimberCount: async () => {
      const resp = await fetch(
        "https://display.safespace.io/value/live/a7796f34",
      );
      const count = await resp.text();
      return parseInt(count);
    },
  },
};

const slashCommands: { [commandName: string]: CommandWithHandler } = {
  climbers: {
    command: new dc.Command(
      "climbers",
      "Get the current number of climbers at a gym",
    ).options(
      new dc.Option("gym", "The gym to get the number of climbers for").choices(
        ...Object.entries(gyms).map(([value, { name }]) => ({ name, value })),
      ),
    ),
    handler: async (context) => {
      const gymKey = context.values["gym"]?.toString() ?? Object.keys(gyms)[0];
      const gym = gyms[gymKey];
      if (!gym) {
        throw new Error(`Gym not found: ${gymKey}`);
      }
      const count = await gym.getClimberCount();
      const message = pluralize(
        {
          one: `There is # climber at ${gym.name}`,
          other: `There are # climbers at ${gym.name}`,
        },
        count,
      );
      return context.res(message);
    },
  },
};

const register = cmd.command({
  name: "Register",
  description: "Register slash commands with Discord",
  args: {
    discordApplicationId: cmd.option({
      type: cmd.string,
      env: "DISCORD_APPLICATION_ID",
      long: "discord-application-id",
    }),
    discordToken: cmd.option({
      type: cmd.string,
      env: "DISCORD_TOKEN",
      long: "discord-token",
    }),
  },
  handler: async ({ discordApplicationId, discordToken }) => {
    await dc.register(
      Object.values(slashCommands).map((c) => c.command),
      discordApplicationId,
      discordToken,
    );
    console.log("ClimbBot registered slash commands!");
  },
});

const start = cmd.command({
  name: "Start",
  description: "Start the bot",
  args: {
    discordApplicationId: cmd.option({
      type: cmd.string,
      env: "DISCORD_APPLICATION_ID",
      long: "discord-application-id",
    }),
    discordPublicKey: cmd.option({
      type: cmd.string,
      env: "DISCORD_PUBLIC_KEY",
      long: "discord-public-key",
    }),
    discordToken: cmd.option({
      type: cmd.string,
      env: "DISCORD_TOKEN",
      long: "discord-token",
    }),
  },
  handler: ({ discordApplicationId, discordPublicKey, discordToken }) => {
    const discordApp = new dc.DiscordHono();
    discordApp.discordKey(() => ({
      APPLICATION_ID: discordApplicationId,
      PUBLIC_KEY: discordPublicKey,
      TOKEN: discordToken,
    }));
    for (const [name, cmd] of Object.entries(slashCommands)) {
      discordApp.command(name, async (c) => cmd.handler(c));
    }
    serve({
      fetch: (req) => discordApp.fetch(req),
      port: 8080,
    });
    console.log("ClimbBot is running!");
  },
});

const app = cmd.subcommands({
  name: "ClimbBot",
  cmds: { register, start },
});
cmd.run(app, Bun.argv.slice(2));
