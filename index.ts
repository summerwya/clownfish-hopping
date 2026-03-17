import {
    ChatInputCommandInteraction,
    Client,
    Events,
    GatewayIntentBits,
    Interaction,
    Message,
    MessageFlags,
    MessagePayload,
    MessageReplyOptions,
    Partials
} from "discord.js";
import "dotenv/config";
import {existsSync, lstatSync, readFileSync, writeFileSync} from "fs";
import randomize from "./randomize";
import {addDash, enOrDis, pick} from "./utilities";
import {ServerConfiguration} from "./types";

// SECTION - Global Variables
const SERVER_CONFIGURATIONS_FILE: string = "data/server-configs.json";

const DEFAULT_REPLY_CHANCE: number = 20;
const DIALOGUE_LIST: string[] = readFileSync("data/dialogues.txt").toString().split("\n").filter(content => !!content);

let serverConfigs: Record<string, ServerConfiguration> = {};
//!SECTION

// SECTION - Helpers
const saveServerConfigFile = (): void => writeFileSync(SERVER_CONFIGURATIONS_FILE, JSON.stringify(serverConfigs));
const getGuildId = (interaction: ChatInputCommandInteraction): string => interaction.guildId ?? interaction.channelId;
function addServerIfNotExists(guildId: string): void {
    if (guildId in serverConfigs) return;

    serverConfigs[guildId] = {
        enable: true,
        chance: DEFAULT_REPLY_CHANCE,
        disable: [],
        onlyInteractWithThisRole: null
    };
}
// !SECTION

// SECTION - Utilities
async function sendReply(message: Message, content: string | MessagePayload | MessageReplyOptions) {
    try {
        await message.reply(content);
    } catch(e) {
        console.warn("Couldn't send message", e);
    }
}
// !SECTION

// SECTION - Command Handlers
async function cmdSetChance(interaction: ChatInputCommandInteraction): Promise<void> {
    const chance: number = interaction.options.getInteger("chance", true);

    serverConfigs[getGuildId(interaction)].chance = chance;
    saveServerConfigFile();

    await interaction.reply({ content: `Reply chance set to 1 in ${chance}` });
}
async function cmdSetGlobal(interaction: ChatInputCommandInteraction): Promise<void> {
    const enable: boolean = interaction.options.getBoolean("enable") ?? true;

    serverConfigs[getGuildId(interaction)].enable = enable;
    saveServerConfigFile();

    await interaction.reply({ content: `You've **${enOrDis(enable)}abled** me everywhere on the server`, flags: MessageFlags.Ephemeral });
}
async function cmdSetDisableInHere(interaction: ChatInputCommandInteraction): Promise<void> {
    const channel = interaction.options.getChannel("channel") || interaction.channel!;
    const disable: boolean = interaction.options.getBoolean("disable") ?? true;

    const serverConfig: ServerConfiguration = serverConfigs[getGuildId(interaction)];
    if (disable) serverConfig.disable.push(channel.id);
    else serverConfig.disable = serverConfig.disable.filter(id => id !== channel.id);
    saveServerConfigFile();

    await interaction.reply(`I've been ${enOrDis(!disable)}abled in ${channel}`);
}
async function cmdSetOnlyInteractWith(interaction: ChatInputCommandInteraction): Promise<void> {
    const role = interaction.options.getRole("role")!;

    serverConfigs[getGuildId(interaction)].onlyInteractWithThisRole = role.id;
    saveServerConfigFile();

    await interaction.reply({ content: `I'll only interact with members with the ${role} from now on`, flags: MessageFlags.Ephemeral });
}
// !SECTION

// SECTION - Discord Client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Message]
});

client.on(Events.MessageCreate, async message => {
    if (!message.guildId) return;
    addServerIfNotExists(message.guildId);

    // Ignore message if it's the bot's message, not from a guild, or disabled in the guild
    if (message.author.id === client.user!.id || !message.guildId || !serverConfigs[message.guildId].enable) return;

    const serverConfig: ServerConfiguration = serverConfigs[message.guildId]!;

    // Check if there's a specific role that the bot should only interact with, if yes and the message author doesn't have that role, then just ignore
    if (serverConfig.onlyInteractWithThisRole && !message.member?.roles.cache.has(serverConfig.onlyInteractWithThisRole)) return;

    if (Math.floor(Math.random() * serverConfig.chance) === 1) await sendReply(message, randomize(pick(DIALOGUE_LIST)));
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!(interaction instanceof ChatInputCommandInteraction)) return;

    addServerIfNotExists(getGuildId(interaction));

    const commandName = interaction.commandName + addDash(interaction.options.getSubcommandGroup(false)) + addDash(interaction.options.getSubcommand(false));

    switch(commandName) {
        case "set-global": await cmdSetGlobal(interaction); break;
        case "set-disable-in-here": await cmdSetDisableInHere(interaction); break;
        case "set-chance": await cmdSetChance(interaction); break;
        case "set-only-interact-with": await cmdSetOnlyInteractWith(interaction);
    }
});

client.once(Events.ClientReady, async client => {
    if (!process.env.ALIVE_CHANNEL) return;

    try {
        if (!process.env.ALIVE_CHANNEL_ID) throw new Error("No ALIVE_CHANNEL_ID env variable set");

        const channel = await client.channels.fetch(process.env.ALIVE_CHANNEL_ID, {force: true});
        if (!channel?.isSendable()) return console.warn(`Can't send messages in ${channel}`);

        await channel.send("I'm alive");
    } catch(e) {
        console.warn("Couldn't say that I was back", e);
    }
});

client.once(Events.ClientReady, readyClient => console.log(`Logged in as ${readyClient.user.tag}`));
//!SECTION

//SECTION - Initialization
// Check if the configuration file exists, create one if not
if (existsSync(SERVER_CONFIGURATIONS_FILE) && lstatSync(SERVER_CONFIGURATIONS_FILE).isFile()) {
    serverConfigs = JSON.parse(readFileSync(SERVER_CONFIGURATIONS_FILE).toString());
} else saveServerConfigFile();

client.login(process.env.DISCORD_TOKEN).then(() => {});

//!SECTION