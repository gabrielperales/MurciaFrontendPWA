require('env2')('.env');
const path = require('path');
const webPush = require('web-push');
const express = require('express');
const bodyParser = require('body-parser');

const keys = webPush.generateVAPIDKeys();
webPush.setGCMAPIKey(process.env.GCM_API_KEY);
webPush.setVapidDetails(`mailto:${process.env.SUPPORT_EMAIL}`, keys.publicKey, keys.privateKey);

let subscriptions = [];

const app = express();

// parse application/json
app.use(bodyParser.json());

app.get('/manifest.json', (req, res) => {
  const responseJson = {
    name: 'MurciaFrontend WPA',
    gcm_sender_id: process.env.GCM_SENDER_ID,
    permissions: [
      'gcm',
    ],
    icons: [{
      src: 'assets/icons/96.jpg',
      sizes: '96x96',
      type: 'image/jpg',
    }, {
      src: 'assets/icons/144.jpg',
      sizes: '144x144',
      type: 'image/jpg',
    }, {
      src: 'assets/icons/192.jpg',
      sizes: '192x192',
      type: 'image/jpg',
    }, {
      src: 'assets/icons/256.jpg',
      sizes: '256x256',
      type: 'image/jpg',
    }, {
      src: 'assets/icons/512.jpg',
      sizes: '512x512',
      type: 'image/jpg',
    }],
    start_url: '/',
    display: 'standalone',
    theme_color: '#9A1319',
  };

  res.json(responseJson);
});

app.post('/subscription', (req, res) => {
  if (!req.body) {
    res.sendStatus(400);
  } else {
    const { subscription } = req.body;
    const subscripted = subscriptions
      .map(sub => sub.endpoint)
      .find(endpoint => endpoint === subscription.endpoint);

    if (!subscripted) {
      subscriptions.push(subscription);
    }

    res.sendStatus(200);
  }
});

app.get('/pushKey', (req, res) => {
  res.json({
    key: keys.publicKey,
  });
});

app.get('/send-notification', (req, res) => {
  const { title, body } = req.query;

  if (!title || !body) {
    res.sendStatus(400);
  } else {
    const payload = JSON.stringify({
      title,
      body,
    });

    subscriptions.forEach((subscription) => {
      webPush.sendNotification(subscription, payload)
        .catch(({ statusCode, body }) => {
          console.log(`statusCode: ${statusCode}`);
          console.log(`body: ${body}`);
          subscriptions = subscriptions.filter(sub => sub !== subscription);
        })
    });

    res.sendStatus(200);
  }
});

app.use('/', express.static(path.join(__dirname, 'public')));

app.use('/', (req, res) => {
  const index =
  `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
      <title>Murcia Frontend PWA</title>
      <link rel="manifest" href="manifest.json"/>
      <link rel="stylesheet" href="css/style.css"/>
    </head>
    <body>
       <h1>Murcia Frontend</h1>
       <h2>Registrando Service Workers y Cacheando recursos!</h2>
       <img src="assets/murciaFrontendLogo.jpg" alt="Logotipo del meetup Murcia Frontend">
       <script>
          window.pushKey = '${keys.publicKey}';
       </script>
       <script src="main.js" type="text/javascript" charset="utf-8"></script>
    </body>
  </html>
  `;

  res.send(index);
});


app.listen(3000, () => {
  console.log('App listening on port 3000');
  console.log(`Push public key : ${keys.publicKey}`);
});

