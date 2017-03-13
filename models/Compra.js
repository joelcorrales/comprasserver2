var mongoose = require('mongoose');

// Create the Task Schema
var CompraSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	price: {
		type: Number,
		required: true
	},
	date: {
		type: Date,
		required: true
	},
	user: {
		type: String,
		required: true
	}
});

// Export the model Schema
module.exports = CompraSchema;