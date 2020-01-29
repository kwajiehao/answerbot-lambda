const _ = require('lodash');
const dialogflow = require('dialogflow');
const uuidv4 = require('uuid/v4');

const projectId = process.env.PROJECT_ID;
const languageCode = process.env.LANGUAGE_CODE;

async function detectIntent(
  projectId,
  sessionId,
  query,
  contexts,
  languageCode
) {
  const sessionClient = new dialogflow.SessionsClient();
  console.log('test')

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

exports.handler = async (event, lambdaContext, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const res = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "*/*",
            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
            "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
        }
    };
    
  let intentResponse;
  let answer, suggestions
  const { value: query, context } = JSON.parse(event["body"])
  try {
    intentResponse = await detectIntent(
      projectId,
      uuidv4(),
      query,
      context,
      languageCode
    )    
    answer = intentResponse.queryResult.fulfillmentText
    context = intentResponse.queryResult.outputContexts;
    suggestions = _.find(intentResponse.queryResult.fulfillmentMessages, (message) => {
      return message.platform === 'ACTIONS_ON_GOOGLE' && message.suggestions
    })
    linksOut = _.find(intentResponse.queryResult.fulfillmentMessages, (message) => {
      return message.platform === 'ACTIONS_ON_GOOGLE' && message.linkOutSuggestion
    })

    const response = { context, answer, suggestions, linksOut }
 
    res.body = JSON.stringify(response, null, 2)
    callback(null, res);
  } catch (err) {
    console.error(err)
  }
};
