require("dotenv").config()
const Discord = require("discord.js")
const client = new Discord.Client()


function Session(isActive, playerVotes = {}, playerNum = 0, channel = null) {
    this.playerVotes = playerVotes;
    this.isActive = isActive;
    this.playerNum = playerNum;
    this.channel = channel;

    this.playersLeft = function () {
        return this.playerNum - Object.keys(playerVotes).length;
    };

    this.isSameTeam = function () {
        return Object.values(this.playerVotes).every((val, i, arr) => val === arr[0]);
    };
}

let globalSession = new Session(false, {});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
    client.user.setActivity("!anon help", {
        type: "PLAYING"
    });
})

client.on("message", msg => {
    const author = msg.author.username;
    const playerNum = parseInt(msg.content.charAt(7)) || 0;
    const channelID = msg.channel.id;
    const messageType = msg.channel.type;
    const sanitizedInput = msg.content.toLowerCase();
    const memberJoin = msg.type === "GUILD_MEMBER_JOIN";

    // Game ending
    function finalizeGame() {
        const text = globalSession.isSameTeam() ? colorGreen(`Hooray! You guys are on the same team!!`) : colorRed(`You guys are NOT on the same team.`);
        const partingText = "Contact <@396131916098568192> or visit https://github.com/nad0m/agent-anon for more bot details and features.";
        globalSession.channel.send(text);
        globalSession.channel.send(partingText);
        globalSession = new Session(false, {}, 0, client.channels.cache.get(channelID));
    }

    // Start game
    if (sanitizedInput.startsWith("!start") && messageType === 'text' && !globalSession.isActive && playerNum) {
        const newGameText = `STARTING NEW GAME WITH ${playerNum} PLAYERS`;
        const instructText = `Click here -> <@${client.user.id}> and privately message your role as \`good\` or \`bad\`.`;
        globalSession = new Session(true, {}, playerNum, client.channels.cache.get(channelID));
        globalSession.channel.send(colorBlue(newGameText));
        globalSession.channel.send(instructText);

    }

    // During game
    else if (globalSession.isActive && messageType === 'dm' && (sanitizedInput === 'good' || sanitizedInput === 'bad')) {
        globalSession.playerVotes[author] = sanitizedInput;
        const submittedText = `${author} submitted their role! Waiting on ${globalSession.playersLeft()} more entries.`;
        globalSession.channel.send(colorYellow(submittedText));
        msg.reply("Thanks for submitting your role! Navigate back to your channel to see the results.");

        if (globalSession.playersLeft() === 0) {
            finalizeGame();
        }
    }

    // Quit game
    else if (sanitizedInput === "!quit" && messageType === 'text') {
        if (globalSession.channel && globalSession.isActive) {
            globalSession.channel.send("Current session erased. Type !start `# of players` in channel to start new session.");
        }
        globalSession = new Session(false, {}, 0, client.channels.cache.get(channelID));
    }

    // Display help message
    else if (sanitizedInput === "!anon help" && messageType === 'text') {
        const text = colorYellow("Begin session: !start {playerAmount}\nex: !start 4\nThis begins the session with 4 players.");
        client.channels.cache.get(channelID).send(text);
    }

    else if (memberJoin) {
        const details = "For more details about this bot and its creator, contact <@396131916098568192> or visit https://github.com/nad0m/agent-anon";
        client.channels.cache.get(channelID).send("Hi, I'm Agent Anon. Type `!anon help` on how to use."); 
        client.channels.cache.get(channelID).send(details);
    }
})

client.login(process.env.BOT_TOKEN);

// Utils
function colorBlue(text) {
    const startTilde = "```ini\n[";
    const endTilde = "]\n```";

    return `${startTilde}${text}${endTilde}`;
}

function colorYellow(text) {
    const startTilde = "```fix\n";
    const endTilde = "\n```";

    return `${startTilde}${text}${endTilde}`;
}

function colorGreen(text) {
    const startTilde = "```diff\n+ ";
    const endTilde = " +\n```";

    return `${startTilde}${text}${endTilde}`;
}

function colorRed(text) {
    const startTilde = "```diff\n- ";
    const endTilde = " -\n```";

    return `${startTilde}${text}${endTilde}`;
}

