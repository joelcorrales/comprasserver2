var mongoose = require('mongoose');

// Create the Task Schema
var UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	}
});

// Export the model Schema
module.exports = UserSchema;