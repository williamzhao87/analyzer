const request = require('request');
const workspace = require('genesys-workspace-client-js');
// const ProvisioningApi = require('genesys-provisioning-client-js');
const Statistics = require('genesys-statistics-client-js');
// const authentication = require('genesys-authentication-client-js');
const keys = require('../config/keys');
const workspaceApi = new workspace(keys.wweApiKey, keys.wweApiUrl);
const statisticsApi = new Statistics(keys.wweApiKey, keys.wweApiUrl);
const storage = require('../storage');

module.exports = (app, io) => {
  function login(req, res) {
    const encodedCredentials = new Buffer(`${keys.wweClientId}:${keys.wweClientSecret}`).toString('base64');
    const username = req.body.username;
    const password = req.body.password;

    request.post(
      `${keys.wweApiUrl}/auth/v3/oauth/token`,
      {
        headers: {
          // 'x-api-key': keys.wweApiKey,
          'content-type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${encodedCredentials}`
        },
        form: {
          // client_id: keys.wweClientId,
          grant_type: 'client_credentials'
          // scope: '*',
          // username: `wz\\SIP_5002`,
          // password: 5002
        },
        json: true
      },
      function(err, res2, body) {
        if (res2.statusCode >= 300) {
          return res.status(401).send(body);
        }
        storage.access_token = body.access_token;
        request.post(`http://${req.headers.host}/wwe/initialize`, function optionalCallback(err, httpResponse, body) {
          console.log('successfully initialized');
        });
        res.status(200).send({ success: 'user logged in' });
      }
    );
  }

  app.post('/wwe/login', (req, res) => {
    if (storage.access_token === '') {
      return login(req, res);
    }
    res.status(200).send({ Success: 'User already logged in' });
  });

  app.post('/wwe/logout', (req, res) => {
    workspaceApi.destroy();
    res.status(200).send({ success: 'user logged out' });
  });

  app.post('/wwe/initialize', (req, res) => {
    if (storage.access_token) {
      return workspaceApi
        .initialize({ token: storage.access_token })
        .then(() => {
          console.log('wwe initialized');
          workspaceApi
            .activateChannels(workspaceApi.user.employeeId, null, workspaceApi.user.defaultPlace)
            .then(() => {
              storage.user = workspaceApi.user;
              statisticsApi.initialize(storage.access_token).then(() => {
                return res.send({ Success: 'workspace initialized' });
              });
            })
            .catch(err => {
              throw new Error(err);
            });
        })
        .catch(err => {
          console.error(err.message);
          res.status(500).send({ Error: 'initializing workspace' });
        });
    }
    res.status(401).send({ Error: 'User must be signed in' });
  });

  app.get('/wwe', (req, res) => {
    res.send({ Status: "You've successfully called wwe!" });
  });

  workspaceApi.on('DnStateChanged', async msg => {
    console.log('emitting dn State changed');
    io.emit('agent-state-update', msg);
  });

  // Event when the call state has changed (Ringing, Established..)
  workspaceApi.on('CallStateChanged', async msg => {
    const call = msg.call;
    switch (call.state) {
      case 'Ringing':
        return;
      case 'Established':
        console.log('call established');
        storage.customer_transcript = [];
        return io.emit('call-established', msg);
      case 'Held':
        return;
      case 'Released':
        console.log('call ended');
        return io.emit('call-ended', msg);
    }
  });

  return app;
};
