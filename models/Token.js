var mongoose = require('mongoose');

// Create the Token Schema
var TokenSchema = new mongoose.Schema({
	token: {
		type: String,
		required: true
	}
});

// Export the model Schema
module.exports = TokenSchema;