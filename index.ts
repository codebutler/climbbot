import {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  Events,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import * as cmd from "cmd-ts";

type Gyms = Record<
  string,
  {
    name: string;
    getClimberCount: () => Promise<string>;
  }
>;

type SlashCommands = Record<
  string,
  {
    data: Partial<SlashCommandBuilder>;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  }
>;

const gyms: Gyms = {
  "vital-brooklyn": {
    name: "Vital Brooklyn",
    getClimberCount: async () => {
      const resp = await fetch(
        "https://display.safespace.io/value/live/a7796f34",
      );
      const count = await resp.text();
      return count;
    },
  },
};

const slashCommands: SlashCommands = {
  climbers: {
    data: new SlashCommandBuilder()
      .setName("climbers")
      .setDescription("Get the current number of climbers at a gym")
      .addStringOption((option) =>
        option
          .setName("gym")
          .setDescription("The gym to get the number of climbers for")
          .addChoices(
            ...Object.entries(gyms).map(([key, { name }]) => ({
              name,
              value: key,
            })),
          ),
      ),
    execute: async (interaction) => {
      const gymKey =
        interaction.options.getString("gym") ?? Object.keys(gyms)[0];
      const gym = gyms[gymKey as keyof typeof gyms];
      if (!gym) {
        return;
      }
      const count = await gym.getClimberCount();
      await interaction.reply(`There are ${count} climbers at ${gym.name}`);
    },
  },
};

const register = cmd.command({
  name: "Register",
  description: "Register slash commands with Discord",
  args: {
    discordClientId: cmd.option({
      type: cmd.string,
      env: "DISCORD_CLIENT_ID",
      long: "discord-client-id",
    }),
    discordToken: cmd.option({
      type: cmd.string,
      env: "DISCORD_TOKEN",
      long: "discord-token",
    }),
  },
  handler: async ({ discordClientId, discordToken }) => {
    const rest = new REST().setToken(discordToken);
    await rest.put(Routes.applicationCommands(discordClientId), {
      body: Object.values(slashCommands).map(({ data }) => data.toJSON!()),
    });
    console.log("Successfully registered slash commands.");
  },
});

const start = cmd.command({
  name: "Start",
  description: "Start the bot",
  args: {
    discordToken: cmd.option({
      type: cmd.string,
      env: "DISCORD_TOKEN",
      long: "discord-token",
    }),
  },
  handler: ({ discordToken }) => {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    console.log("Starting bot");
    client.once(Events.ClientReady, (readyClient) => {
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    });
    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) {
        return;
      }
      const slashCmd = slashCommands[interaction.commandName];
      if (!slashCmd) {
        return;
      }
      await slashCmd.execute(interaction);
    });
    client.login(discordToken);

    // for health checks
    Bun.serve({
      port: 8080,
      fetch: () => new Response("OK!"),
    });
  },
});

const app = cmd.subcommands({
  name: "ClimbBot",
  cmds: { register, start },
});
cmd.run(app, Bun.argv.slice(2));
