<img src="logo.png" width="200">

# ClimbBot

Discord bot that displays the number of people at the Vital climbing gym in Brooklyn.

* [Invite ClimbBot to your Discord server](https://discord.com/oauth2/authorize?client_id=1216457310906617886&permissions=2147483648&scope=bot+applications.commands)


## Development

To install dependencies:

```bash
bun install
```

To run:

Create a .env file with the following:

```
DISCORD_APPLICATION_ID=your_discord_application_id
DISCORD_PUBLIC_KEY=your_discord_public_key
DISCORD_TOKEN=your_discord_token
```

Then run:


```bash
bun run index.ts register
bun run index.ts start
```

## Credits

Created by Eric Butler <eric@codebutler.com> [X@codebutler](https://x.com/@codebutler)
