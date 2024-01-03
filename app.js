"use strict";

const { App } = require("@slack/bolt");
require("dotenv").config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.command("/live", async ({ command, ack, say }) => {
  try {
    console.log("command>>>>>", command);
    await ack();
    say("I am alive!!!");
  } catch (error) {
    console.log("err");
    console.error(error);
  }
});

app.message("hey", async ({ command, say }) => {
  try {
    say("I noticed your hey, hey back.");
  } catch (error) {
    console.log("err");
    console.error(error);
  }
});

async function sendDirectMessage(userId, messageText) {
  try {
    // Open a conversation with the specified user
    const conversation = await app.client.conversations.open({
      token: process.env.SLACK_BOT_TOKEN,
      users: userId,
    });

    // Post a message to the opened conversation
    const result = await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: conversation.channel.id,
      text: messageText,
    });

    console.log(result);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

(async () => {
  const port = 3002;
  await app.start(process.env.PORT || port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
  sendDirectMessage("U06C780DSH2", "Hello there! This is a DM. during google meeting");
})();
