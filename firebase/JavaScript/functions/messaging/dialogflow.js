const functions = require('firebase-functions');
const nexmo = require('../nexmo-conifg');
const serviceAccount = require('../service-account-key.json');
const dialogflow = require('@google-cloud/dialogflow');


function sendMessage(TO_ID, FROM_ID, MSG) {
  const to = { 'type': 'messenger', 'id': TO_ID };
  const from = { 'type': 'messenger', 'id': FROM_ID };
  const content = {
    'content': {
      'type': 'text',
      'text': MSG
    }
  };

  return new Promise((resolve, reject) => {
    nexmo.channel.send(to, from, content, (err, res) => {
      if (err) reject(err);
      resolve(res);
    })
  });
}


exports.webhook = functions.https.onRequest(async (req, res) => {
  const { message, from, to } = req.body;
  const response = await dialogFlowGateway(message.content.text, from.id);
  sendMessage(from.id, to.id, response[0].queryResult.fulfillmentText);
  res.sendStatus(200);
});

exports.status = functions.https.onRequest((req, res) => {
  console.log(req.body);
  res.sendStatus(200);
});



async function dialogFlowGateway(text, sessionId) {
  const sessionClient = new dialogflow.SessionsClient({ credentials: serviceAccount });
  const sessionPath = sessionClient.projectAgentSessionPath('vonage-api-examples', sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: text,
        // The language used by the client (en-US)
        languageCode: 'en-US',
      },
    },
  };

  return sessionClient.detectIntent(request);
}

// cors(request, response, async () => {
//   const { queryInput, sessionId } = request.body;

//   const sessionClient = new SessionsClient({ credentials: serviceAccount });
//   const session = sessionClient.sessionPath('vonage-api-examples', sessionId);

//   const responses = await sessionClient.detectIntent({ session, queryInput });

//   const result = responses[0].queryResult;

//   response.send(result);
// });