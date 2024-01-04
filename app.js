'use strict';

const { App } = require('@slack/bolt');
const { OpenAIApi, Configuration } = require('openai');
const fs = require('fs').promises;

require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

async function sendDirectMessage(userId, messageText) {
  try {
    const conversation = await app.client.conversations.open({
      token: process.env.SLACK_BOT_TOKEN,
      users: userId,
    });

    const result = await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: conversation.channel.id,
      text: messageText,
    });

    console.log('Message was sent from Capcity Bot: ', result.message.text);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

function initiateConversation(memberId) {
  sendDirectMessage(
    memberId,
    'Hello there! How many projects are you currently on?'
  );
}

const model = process.env.OPENAI_MODEL || 'gpt-4'; // Use a newer model
async function callOpenAi(messages) {
  try {
    const response = await openai.createChatCompletion({
      model,
      messages: messages,
    });

    return response.data.choices[0].message;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return null;
  }
}

async function getNumberFromChat(chat) {
  if (!chat) return;

  const userMessage = {
    role: 'user',
    content: chat,
  };

  const systemMessage = {
    role: 'system',
    content: `
      For the data that you will receive, you are to look for a number which can either in words or digits.
      If the number is found, return it as a digit in the format; {"ok": true, "number": <number>}. 
      If the number is not found, return { "ok": false }
      `,
  };
  const res = await callOpenAi([systemMessage, userMessage]);
  const data = JSON.parse(res.content);

  return data;
}

async function syncConversationToStorage(conversation) {
  const conversations = await readDataFromStorage();

  const index = conversations.findIndex((c) => c.id === conversation.id);

  if (index > -1) {
    conversations[index] = conversation;
  } else {
    conversations.push(conversation);
  }

  const stringifiedConversations = JSON.stringify(conversations, null, 2);

  fs.writeFile('data.json', stringifiedConversations, 'utf8', (err) => {
    if (err) {
      console.error('Something went wrong writing the data to file');
    }
  });
}

async function readDataFromStorage() {
  return fs.readFile('data.json', 'utf8').then((data) => {
    if (!data.trim()) return [];

    const conversations = JSON.parse(data);
    if (Array.isArray(conversations)) return conversations;

    return [];
  });
}

async function getUserConversation(userId) {
  const defaultConversation = {
    id: userId,
    progress: 0,
    numberOfProjects: 0,
    numberOfHoursWorked: 0,
  };

  const conversations = await readDataFromStorage();

  if (Array.isArray(conversations)) {
    const [foundConversation] = conversations.filter((c) => c.id === userId);
    if (!foundConversation) return defaultConversation;

    return foundConversation;
  }
}

app.event('message', async ({ say, event, message }) => {
  const conversation = await getUserConversation(event.user);

  if (event.channel_type === 'im' && !event.subtype) {
    try {
      if (conversation.progress == 0) {
        const res = await getNumberFromChat(message.text);
        if (res.ok) {
          conversation.progress = 1;
          conversation.numberOfProjects = res.number;

          say('How many hours have you worked this week?');
        } else say('How many projects are you working on?');
      } else if (conversation.progress == 1) {
        const res = await getNumberFromChat(message.text);

        if (res.ok) {
          conversation.numberOfHoursWorked = res.number;
          conversation.progress = 0; //reset the conversation progress

          say('Alright. That is all I need for now. Thank you.');
        } else say('How many hours have you worked?');
      }

      syncConversationToStorage(conversation);
    } catch (error) {
      console.log('err', error);
    }
  }
});

const users = []; //Array of member ids

(async () => {
  const port = 3002;
  await app.start(process.env.PORT || port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}!`);

  users.forEach((user) => initiateConversation(user));
})();
