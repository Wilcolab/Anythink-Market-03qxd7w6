module.exports = function (app) {
  const arithmetic = require('./controller');
  app.route('/arithmetic').get(arithmetic.calculate);
  app.route('/feedback').get(arithmetic.getFeedbacks).post(arithmetic.submitFeedback);
};
