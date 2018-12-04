const request = require('request');
const workspace = require('genesys-workspace-client-js');
// const ProvisioningApi = require('genesys-provisioning-client-js');
const Statistics = require('genesys-statistics-client-js');
// const authentication = require('genesys-authentication-client-js');
const keys = require('../config/keys');
const workspaceApi = new workspace(keys.wweApiKey, `${keys.wweApiUrl}:${keys.wwePort}`);
const statisticsApi = new Statistics(keys.wweApiKey, `${keys.wweApiUrl}:${keys.wwePort}`);
const storage = require('../storage');

module.exports = (app, io) => {
  function login(req, res) {
    const encodedCredentials = new Buffer(`${keys.wweClientId}:${keys.wweClientSecret}`).toString('base64');

    request.post(
      `${keys.wweApiUrl}:${keys.wweAuthPort}/auth/v3/oauth/token`,
      {
        headers: {
          'x-api-key': keys.wweApiKey,
          'content-type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${encodedCredentials}`
        },
        form: {
          client_id: keys.wweClientId,
          grant_type: 'password',
          scope: '*',
          username: 'wz\\SIP_5000',
          password: '5000'
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
    // if (storage.access_token === '') {
    return login(req, res);
    // }
    res.status(200).send({ Success: 'User already logged in' });
  });

  app.post('/wwe/logout', (req, res) => {
    workspaceApi.destroy();
    storage.access_token === '';
    res.status(200).send({ success: 'user logged out' });
  });

  app.post('/wwe/initialize', (req, res) => {
    if (storage.access_token) {
      return workspaceApi
        .initialize({ token: storage.access_token })
        .then(() => {
          workspaceApi
            .activateChannels(workspaceApi.user.employeeId, null, workspaceApi.user.defaultPlace)
            .then(() => {
              storage.user = workspaceApi.user;
              statisticsApi.initialize(storage.access_token).then(() => {
                return res.send({ Success: 'workspace initialized' });
              });
            })
            .catch(err => {
              console.error(err.status + ': ' + err.message);
              throw new Error(err);
            });
        })
        .catch(err => {
          console.error(err.status + ': ' + err.message);
          res.status(500).send({ Error: 'initializing workspace' });
        });

      // try {
      //   const wkspace = await workspaceApi.initialize({ token: storage.access_token });
      //   console.log('wwe initialized');
      //   await workspaceApi.activateChannels(workspaceApi.user.employeeId, null, workspaceApi.user.defaultPlace);
      //   storage.user = workspaceApi.user;
      //   await statisticsApi.initialize(storage.access_token);
      //   return res.send({ Success: 'workspace initialized' });
      // } catch (err) {
      //   console.error(err.status + ': ' + err.message);
      //   res.status(500).send({ Error: 'initializing workspace' });
      // }
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
