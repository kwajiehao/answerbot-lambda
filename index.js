const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const dialogflow = require('dialogflow');
const _ = require('lodash')
const uuidv4 = require('uuid/v4');

// Express constants
const port = process.env.PORT;

// Dialogflow constants
const projectId = process.env.PROJECT_ID;
const sessionId = uuidv4();
const languageCode = process.env.LANGUAGE_CODE;

// Instantiate express server
const app = express()
app.use(cors())
app.use(bodyParser.json())


async function detectIntent(
  projectId,
  sessionId,
  query,
  contexts,
  languageCode
) {
  const sessionClient = new dialogflow.SessionsClient();

  // The path to identify the agent that owns the created intent.
  const sessionPath = sessionClient.sessionPath(projectId, sessionId);

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: languageCode,
      },
    },
  };

  if (contexts && contexts.length > 0) {
    request.queryParams = {
      contexts: contexts,
    };
  }

  const responses = await sessionClient.detectIntent(request);
  return responses[0];
}

app.post('/', async (req, res) => {
  let intentResponse;
  let answer, suggestions
  let { query, context } = req.body

  try {
    intentResponse = await detectIntent(
      projectId,
      sessionId,
      query,
      context,
      languageCode
    )
    
    answer = intentResponse.queryResult.fulfillmentText
    context = intentResponse.queryResult.outputContexts;
    suggestions = _.find(intentResponse.queryResult.fulfillmentMessages, (message) => {
      return message.platform === 'ACTIONS_ON_GOOGLE' && message.suggestions
    })
    // linksOut = _.find(intentResponse.queryResult.fulfillmentMessages, (message) => {
    //   return message.platform === 'ACTIONS_ON_GOOGLE' && message.linkOutSuggestion
    // })

    const response = { context, answer, suggestions }
    return res.send(response)
  } catch (err) {
    console.error(err)
  }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
