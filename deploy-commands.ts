import {
    InteractionContextType,
    PermissionFlagsBits,
    RESTPostAPIApplicationCommandsJSONBody,
    SlashCommandBuilder,
} from "discord.js";
import { REST, Routes } from 'discord.js';

async function main() {
    const commands: RESTPostAPIApplicationCommandsJSONBody[] = [
        new SlashCommandBuilder()
            .setName("set")
            .setDescription("Set settings")
            .setContexts([InteractionContextType.PrivateChannel, InteractionContextType.Guild])
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.BanMembers)
            .addSubcommand(subCmd => subCmd.setName("global")
                .setDescription("Set global (server-wide) settings")
                .addBooleanOption(opt => opt.setName("enable")
                    .setDescription("Enable this action?")
                )
            )
            .addSubcommand(cmd => cmd.setName("disable-in-here")
                .setDescription("Disable specific actions in the specified or current channel")
                    .addChannelOption(opt => opt.setName("channel")
                        .setDescription("Channel to disable this in")
                    )
                    .addBooleanOption(opt => opt.setName("disable")
                        .setDescription("disable this action?")
                    )
                )
            .addSubcommand(cmd => cmd.setName("only-interact-with")
                .setDescription("Make the bot only interact with this specific role")
                .addRoleOption(opt => opt.setName("role")
                    .setDescription("Only interact with members with this role")
                    .setRequired(true)
                )
            )
            .addSubcommand(cmd => cmd.setName("chance")
                .setDescription("Set the chance of me replying action")
                .addIntegerOption(opt => opt.setName("chance")
                    .setDescription("Do this action with an 1 in N chance")
                    .setMinValue(2)
                    .setRequired(true)
                )
            )
    ].map(builder => builder.toJSON());

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

    try {
        console.log(`Started refreshing ${commands.length} commands.`);

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
            {body: commands},
        );

        console.log(`Successfully reloaded commands.`);
    } catch (error) {
        console.error(error);
    }
}

main().then(() => {});