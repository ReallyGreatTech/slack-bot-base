/* eslint-disable no-mixed-spaces-and-tabs */
const { App } = require('@slack/bolt');
const fs = require('fs');
require('dotenv').config();
const cron = require('node-cron');

// Initialize the Slack Bolt App with necessary credentials.
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,            
  signingSecret: process.env.SLACK_SIGNING_SECRET, 
  socketMode: true,                               
  appToken: process.env.SLACK_APP_TOKEN,          
});

// Respond to a message containing "hey" in any channel where the bot is present.
app.message('hey', async ({ command, say }) => {
  try {
    // Sends a message back in the same channel.
    say('I noticed your hey, hey back.');
  } catch (error) {
    console.error('Error handling \'hey\' message:', error);
  }
});



// Modal Callback Function
app.view('capacity_check_modal', async ({ ack, body, view, client }) => {
  await ack();
  
  const userId = body.user.id;
  const values = view.state.values;
  
  const numProjects = values.num_projects.project_selection.selected_option.value;
  const workHours = values.work_hours.hours_input.value;
  const extraCapacity = values.extra_capacity.capacity_selection.selected_option.value;
  const additionalHours = values.additional_capacity.additional_capacity_input.value;
  
  // Get current timestamp
  const timestamp = new Date().toISOString();
  
  // Format the data to be written
  const dataToWrite = `Timestamp: ${timestamp}, User: ${userId}, Projects: ${numProjects}, Work Hours: ${workHours}, Extra Capacity: ${extraCapacity}, Additional Hours: ${additionalHours}\n`;
  
  // Write the data to file_storage.txt
  fs.appendFile('file_storage.txt', dataToWrite, (err) => {
	  if (err) {
      console.error('Error writing to file:', err);
	  } else {
      console.log('Data saved to file_storage.txt');
  
      // Send a confirmation message to the user
      client.chat.postMessage({
		  channel: userId,
		  text: 'Received your submission. Thank you!',
      }).catch(console.error);
	  }
  });
});
  


// Function to send an interactive message with a button to a specified user.
async function sendInteractiveMessage(userId) {
  try {
    // Open a direct message conversation with the specified user.
    const conversation = await app.client.conversations.open({
      token: process.env.SLACK_BOT_TOKEN,
      users: userId,
    });

    // Post a message to the opened direct message conversation.
    const result = await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: conversation.channel.id,
      text: 'Hi there! Time to fill your weekly capacity',
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

    console.log('Interactive message sent!');
  } catch (error) {
    console.error('Error sending interactive message:', error);
  }
}

// Action listener for the button in the interactive message.
app.action('open_modal_button', async ({ body, ack, client }) => {
  await ack();  // Acknowledge the button action request.
  
  try {
	  // Open a modal.
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'capacity_check_modal',
        title: {
          type: 'plain_text',
          text: 'Weekly Capacity Check',
        },
        blocks: [
          // Dropdown for selecting the number of projects
          {
            type: 'input',
            block_id: 'num_projects',
            label: {
              type: 'plain_text',
              text: 'How many projects are you actively working on?',
            },
            element: {
              type: 'static_select',
              action_id: 'project_selection',
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: '0',
                  },
                  value: '0',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '1',
                  },
                  value: '1',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '2',
                  },
                  value: '2',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: '3',
                  },
                  value: '3',
                },
              ],
            },
          },
          // Small text under the dropdown for number of projects
          {
            type: 'context',
            elements: [
              {
                type: 'plain_text',
                text: '1 to 2 projects',
              },
            ],
          },
          // Input field for estimating work hours
          {
            type: 'input',
            block_id: 'work_hours',
            label: {
              type: 'plain_text',
              text: 'Provide an estimate of the number of work hours for this week',
            },
            element: {
              type: 'plain_text_input',
              action_id: 'hours_input',
            },
          },
          // Small text under the work hours input field
          {
            type: 'context',
            elements: [
              {
                type: 'plain_text',
                text: 'e.g., 30 hours',
              },
            ],
          },
          // Dropdown for indicating extra capacity
          {
            type: 'input',
            block_id: 'extra_capacity',
            label: {
              type: 'plain_text',
              text: 'Do you have extra capacity to work on other projects?',
            },
            element: {
              type: 'static_select',
              action_id: 'capacity_selection',
              options: [
                {
                  text: {
                    type: 'plain_text',
                    text: 'Yes',
                  },
                  value: 'yes',
                },
                {
                  text: {
                    type: 'plain_text',
                    text: 'No',
                  },
                  value: 'no',
                },
              ],
            },
          },
          // Input field for specifying additional capacity in hours
          {
            type: 'input',
            block_id: 'additional_capacity',
            label: {
              type: 'plain_text',
              text: 'If you answered yes to the previous question, please provide how much capacity in hours you can dedicate',
            },
            element: {
              type: 'plain_text_input',
              action_id: 'additional_capacity_input',
            },
          },
          // Small text under the additional capacity input field
          {
            type: 'context',
            elements: [
              {
                type: 'plain_text',
                text: 'e.g., 20 hours',
              },
            ],
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


const sendForm = () =>{
  const userIds = ['U06C785U26Q', 'U06C4MY2Y1H', 'U06CTJQJTBJ'];
  userIds.forEach(async (userId) => {
    await sendInteractiveMessage(userId);
  });

};


cron.schedule('0 14 * * 1', () => {
  try {
    console.log('running a task every Monday at 2:00pm');
    sendForm();
    
  } catch (error) {
    console.log(error);
  }
}, {
  timezone: 'GMT',
});


(async () => {
  const port = process.env.PORT || 3002;
  await app.start(port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
})();