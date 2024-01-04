const { App } = require("@slack/bolt");
const { google } = require('googleapis');
require("dotenv").config();

// Initialize the Slack Bolt App with necessary credentials.
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Function to write data to Google Sheets
async function writeToSheet(data) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'spreadsheetconnector-410113-b18420bebd3d.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheetsClient = await auth.getClient();
    const spreadsheetId = process.env.SPREADSHEET_ID; // Replace with spreadsheet ID
    const range = 'Sheet1!A1'; // Replace with your range

    const response = await google.sheets({ version: 'v4', auth: sheetsClient }).spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [data] },
    });

    console.log('Data written to sheet:', response.data);
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
  }
}

// Modal callback function
app.view('capacity_check_modal', async ({ ack, body, view, client }) => {
  await ack();

  const userId = body.user.id;
  const values = view.state.values;

  const numProjects = values.num_projects.project_selection.selected_option.value;
  const workHours = values.work_hours.hours_input.value;
  const extraCapacity = values.extra_capacity.capacity_selection.selected_option.value;
  const additionalHours = values.additional_capacity.additional_capacity_input.value;
  const timestamp = new Date().toISOString();

  // Data array to be written to Google Sheets
  const dataToWrite = [timestamp, userId, numProjects, workHours, extraCapacity, additionalHours];

  // Write data to Google Sheets
  await writeToSheet(dataToWrite);

  // Send a confirmation message to the user
  try {
    await client.chat.postMessage({
      channel: userId,
      text: "Received your submission. Thank you!",
    });
  } catch (error) {
    console.error('Error sending confirmation message:', error);
  }
});

// Function to send an interactive message with a button to a specified user.
async function sendInteractiveMessage(userId) {
  try {
    const conversation = await app.client.conversations.open({
      token: process.env.SLACK_BOT_TOKEN,
      users: userId,
    });

    await app.client.chat.postMessage({
		token: process.env.SLACK_BOT_TOKEN,
		channel: conversation.channel.id,
		text: "Hi there! Time to fill your weekly capacity",
		attachments: [
			{
			  blocks: [
				{
				  type: "actions",
				  elements: [
					{
					  type: "button",
					  text: {
						type: "plain_text",
						text: "Open Modal"
					  },
					  action_id: "open_modal_button" 
					}
				  ]
				}
			  ]
			}
		]
    });

    console.log("Interactive message sent to", userId);
  } catch (error) {
    console.error("Error sending interactive message to", userId, ":", error);
  }
}

// Action listener for the button in the interactive message.
app.action("open_modal_button", async ({ body, ack, client }) => {
	await ack();
	try {
		// Open a modal.
		  await client.views.open({
			  trigger_id: body.trigger_id,
			  view: {
			  type: "modal",
			  callback_id: "capacity_check_modal",
			  title: {
				  type: "plain_text",
				  text: "Weekly Capacity Check"
			  },
			  blocks: [
				  // Dropdown for selecting the number of projects
				  {
				  type: "input",
				  block_id: "num_projects",
				  label: {
					  type: "plain_text",
					  text: "How many projects are you actively working on?"
				  },
				  element: {
					  type: "static_select",
					  action_id: "project_selection",
					  options: [
					  {
						  text: {
						  type: "plain_text",
						  text: "0"
						  },
						  value: "0"
					  },
					  {
						  text: {
						  type: "plain_text",
						  text: "1"
						  },
						  value: "1"
					  },
					  {
						  text: {
						  type: "plain_text",
						  text: "2"
						  },
						  value: "2"
					  },
					  {
						  text: {
						  type: "plain_text",
						  text: "3"
						  },
						  value: "3"
					  }
					  ]
				  }
				  },
				  // Small text under the dropdown for number of projects
				  {
				  type: "context",
				  elements: [
					  {
					  type: "plain_text",
					  text: "1 to 2 projects"
					  }
				  ]
				  },
				  // Input field for estimating work hours
				  {
				  type: "input",
				  block_id: "work_hours",
				  label: {
					  type: "plain_text",
					  text: "Provide an estimate of the number of work hours for this week"
				  },
				  element: {
					  type: "plain_text_input",
					  action_id: "hours_input"
				  }
				  },
				  // Small text under the work hours input field
				  {
				  type: "context",
				  elements: [
					  {
					  type: "plain_text",
					  text: "e.g., 30 hours"
					  }
				  ]
				  },
				  // Dropdown for indicating extra capacity
				  {
				  type: "input",
				  block_id: "extra_capacity",
				  label: {
					  type: "plain_text",
					  text: "Do you have extra capacity to work on other projects?"
				  },
				  element: {
					  type: "static_select",
					  action_id: "capacity_selection",
					  options: [
					  {
						  text: {
						  type: "plain_text",
						  text: "Yes"
						  },
						  value: "yes"
					  },
					  {
						  text: {
						  type: "plain_text",
						  text: "No"
						  },
						  value: "no"
					  }
					  ]
				  }
				  },
				  // Input field for specifying additional capacity in hours
				  {
				  type: "input",
				  block_id: "additional_capacity",
				  label: {
					  type: "plain_text",
					  text: "If you answered yes to the previous question, please provide how much capacity in hours you can dedicate"
				  },
				  element: {
					  type: "plain_text_input",
					  action_id: "additional_capacity_input"
				  }
				  },
				  // Small text under the additional capacity input field
				  {
				  type: "context",
				  elements: [
					  {
					  type: "plain_text",
					  text: "e.g., 20 hours"
					  }
				  ]
				  }
			  ],
			  submit: {
				  type: "plain_text",
				  text: "Submit"
			  }
			  }
		  });  
	} catch (error) {
	console.error("Error opening modal:", error);
	}
});

// Main function to start the app and send an interactive message.
(async () => {
	const port = process.env.PORT || 3002;
	await app.start(port);
	console.log(`⚡️ Slack Bolt app is running on port ${port}!`);

	// Array of user IDs to send the interactive message to
	const userIds = ["U06CTJQJTBJ", "U06BQ9AJVD5", "U06C785U26Q", "U06C4MY2Y1H", "U06C780DSH2"];
	//const userIds = ["U06CTJQJTBJ"];

	for (const userId of userIds) {
	await sendInteractiveMessage(userId);
}
})();
