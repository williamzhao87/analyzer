var Analyzer = require('../services/Analyzer');
var analyzer = new Analyzer('e05aff10-d23c-44e4-b6bc-1d2887017ee6');
var fs = require('fs');

module.exports = app => {
  app.get('/analyze', (req, res) => {
    analyzer.analyze(fs.createReadStream('./assets/Anger_Dislike_Stress_2.wav'), function(err, analysis) {
      res.send(analysis);
    });
  });
};
