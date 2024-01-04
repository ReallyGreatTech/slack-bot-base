// Import required modules
const { App } = require('@slack/bolt');
require('dotenv').config();

// Initialize the Slack Bolt App with necessary credentials.
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Command listener to respond to "/live" command.
app.command('/live', async ({ command, ack, say }) => {
  try {
    console.log('Command Received:', command);
    await ack(); // Acknowledge the command.
    say('I am alive!!!'); // Respond with a message.
  } catch (error) {
    console.error('Error handling \'/live\' command:', error);
  }
});

// Message listener to respond to messages containing "hey".
app.message('hey', async ({ say }) => {
  try {
    say('I noticed your hey, hey back.');
  } catch (error) {
    console.error('Error handling \'hey\' message:', error);
  }
});

// Function to send an interactive message to a specified user.
async function sendInteractiveMessage(userId) {
  try {
    // Open a direct message conversation with the specified user.
    const conversation = await app.client.conversations.open({
      token: process.env.SLACK_BOT_TOKEN,
      users: userId,
    });
    // Post an interactive message to the opened direct message conversation.
    const result = await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: conversation.channel.id,
      text: 'Reminder: Fill out your Capacity Estimation!',
      attachments: [
        {
          blocks: [
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Open Modal',
                  },
                  action_id: 'open_modal_button',
                },
              ],
            },
          ],
        },
      ],
    });
    console.log('Interactive message sent:', result);
  } catch (error) {
    console.error('Error sending interactive message:', error);
  }
}

// Action listener for the button in the interactive message.
app.action('open_modal_button', async ({ body, ack, client }) => {
  await ack(); // Acknowledge the button action request.
  try {
    // Open a modal when the button is clicked, using the trigger_id from the button action.
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'your_modal',
        title: {
          type: 'plain_text',
          text: 'Capacity Estimation',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'project_count',
            label: {
              type: 'plain_text',
              text: 'How many projects are you actively working on?',
            },
            element: {
              type: 'static_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select an option',
              },
              options: [
                { text: { type: 'plain_text', text: '1' }, value: '1' },
                { text: { type: 'plain_text', text: '2' }, value: '2' },
              ],
            },
          },
          {
            type: 'input',
            block_id: 'work_hours_estimate',
            label: {
              type: 'plain_text',
              text: 'Provide an estimate on the number of work hours for this week',
            },
            element: {
              type: 'plain_text_input',
              placeholder: {
                type: 'plain_text',
                text: '20',
              },
            },
          },
          {
            type: 'input',
            block_id: 'extra_capacity',
            label: {
              type: 'plain_text',
              text: 'Do you have extra capacity to assist on other projects?',
            },
            element: {
              type: 'static_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select an option',
              },
              options: [
                { text: { type: 'plain_text', text: 'Yes' }, value: 'yes' },
                { text: { type: 'plain_text', text: 'No' }, value: 'no' },
              ],
            },
          },
          {
            type: 'input',
            block_id: 'extra_capacity_hours',
            label: {
              type: 'plain_text',
              text: 'If yes, please provide how much capacity in hours you can dedicate.',
            },
            element: {
              type: 'plain_text_input',
              placeholder: {
                type: 'plain_text',
                text: '20',
              },
            },
            optional: true,
          },
        ],
        submit: {
          type: 'plain_text',
          text: 'Submit',
        },
      },
    });
  } catch (error) {
    console.error('Error opening modal:', error);
  }
});

// Event listener for the view_submission event.
app.view('your_modal', async ({ ack, body, view }) => {
  await ack(); // Acknowledge the view submission request.

  try {
    // Extract and handle the submitted data from the view.
    const projectCount =
      view.state.values.project_count.static_select.selected_option.value;
    const workHoursEstimate =
      view.state.values.work_hours_estimate.plain_text_input.value;
    const extraCapacity =
      view.state.values.extra_capacity.static_select.selected_option.value;
    const extraCapacityHours =
      view.state.values.extra_capacity_hours.plain_text_input.value;

    // Do something with the extracted data (e.g., log it).
    console.log('Submitted Data:', {
      projectCount,
      workHoursEstimate,
      extraCapacity,
      extraCapacityHours,
    });

    // You can now use the extracted data as needed.
    // For example, you might want to save it to a database or perform further actions.
  } catch (error) {
    console.error('Error handling view_submission:', error);
  }
});

// Function to launch the interactive modal every 30 seconds.
async function launchInteractiveModal() {
  const currentDate = new Date();

  if (currentDate.getUTCDay() === 3) {
    setInterval(() => {
      sendInteractiveMessage('U06BQ9AJVD5');
    }, 30000);
  }
}

// Main function to start the app.
(async () => {
  const port = process.env.PORT || 3002;
  await app.start(port);
  console.log(`:zap:️ Slack Bolt app is running on port ${port}!`);
  launchInteractiveModal(); // Start launching the interactive modal.
})();
