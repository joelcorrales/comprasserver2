var restful = require('node-restful');

module.exports = function (app, route) {
	// Setup the controller for REST
	var rest = restful.model(
		'compra',
		app.models.compra
	).methods(['get','put','post','delete']);

	// Register this endpoints with the application
	rest.register(app, route);

	// Return middleware
	return function(req, res, next) {
		next();
	};
};