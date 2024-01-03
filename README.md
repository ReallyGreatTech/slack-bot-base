
## # Environmental Variables

| .env variable*               | SOURCE |  
| ---------------------------- | -------------- |  
| PORT                         | User Specified |  
| SLACK_SIGNING_SECRET         | Slack  <sub><sup>[🔗](https://api.slack.com/authentication/verifying-requests-from-slack)</sup></sub> |
| SLACK_BOT_TOKEN              | Slack <sub><sup>[🔗](https://api.slack.com/authentication/token-types#bot)</sup></sub> |
| APP_TOKEN                    | Slack <sub><sup>[🔗](https://api.slack.com/authentication/token-types#app)</sup></sub> |
| OPENAI_API_KEY               | OpenAI <sub><sup>[🔗](https://platform.openai.com/docs/api-reference/authentication)</sup></sub> |

_* .env.sample provided in repo. Rename file to `.env` and replace it with your tokens and port information_

## # Development Setup

1. Generate a simple GitHub repo, and clone down to your local machine. (you will want this ahead of time so you can implement code for the bot to communicate with for your built out slash commands and messages going forward)
2. [Download slack](https://slack.com/downloads/windows)
3. [Generate a workspace](https://slack.com/help/articles/206845317-Create-a-Slack-workspace) you have permissions to create apps in
4. Generate an app through the [slack api](https://api.slack.com/). If you are unfamiliar with generating a slack bot I advise you to follow the tutorial in the next step!
5. For a step by step process to create a bot with some message and slash command you can follow this [tutorial](https://blog.logrocket.com/build-a-slackbot-in-node-js-with-slacks-bolt-api/)
6. Within the above tutorial you will get a guide on setting up [ngrok](https://ngrok.com/), you should do this if you intend on deploying your app to aws lambda after you get your chat module working.
7. Once you have established your proof of life with any simple commands you'd like, you can begin developing your chat module connecting to [Open AI API](https://auth0.openai.com/u/signup/identifier?state=hKFo2SBUSTVZVTZIUDdsTUltbW9WN0dYN0tKZy1UajQxcGFHWqFur3VuaXZlcnNhbC1sb2dpbqN0aWTZIDlrLWpFd1FYbExsZ2g4TVpHSFJSWDFvdHdxRjM4Q0lHo2NpZNkgRFJpdnNubTJNdTQyVDNLT3BxZHR3QjNOWXZpSFl6d0Q)!
8. You will need to setup an account to be able to generate an Open AI API key. Once logged in you can go to the top right image and view your API keys, on the next window you will be able to create a new secret key. **NOTE: DO NOT EXPOSE THIS KEY TO GITHUB OR ANY PUBLIC FACING LOCATION.** If you expose your key it will be revoked and you must generate ## # User Stories

### # References

- [Slack API](https://api.slack.com/)
- [Open AI API](https://openai.com/product#made-for-developers)
- [Building a slack bot tutorial](https://blog.logrocket.com/build-a-slackbot-in-node-js-with-slacks-bolt-api/)
- [Slack bot for generating blogs](https://youtu.be/an_LouGafXc)
