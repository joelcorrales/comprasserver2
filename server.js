var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var mongoose = require('mongoose');
var _ = require('lodash');
var schedule = require('node-schedule');
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

//var MONGOLAB_URI = 'mongodb://admin:55189633@ds145848.mlab.com:45848/comprasdb'; OLD DATABASE
var MONGOLAB_URI = 'mongodb://admin:55189633@ds161039.mlab.com:61039/moneryflowdb';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://moneyflow-c7215.firebaseio.com"
});


/*
Import collection
mongoimport -h ds161039.mlab.com:61039 -d moneryflowdb -c compras -u admin -p 55189633 --file compras.json
Export collection
mongoexport -h ds161039.mlab.com:61039 -d moneryflowdb -c compras -u admin -p 55189633 -o compras.json 
*/

var app = express();

// Add Middleware necesary for REST API's
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'));

// CORS Support
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
});

/*
 * I’m sharing my credential here.
 * Feel free to use it while you’re learning.
 * After that, create and use your own credential.
 * Thanks.
 *
 * MONGOLAB_URI=mongodb://admin:55189633@ds145848.mlab.com:45848/comprasdb
 * 'mongodb://admin:55189633@ds145848.mlab.com:45848/comprasdb'
 */
mongoose.connect(MONGOLAB_URI, function (error) {
    if (error) {
    	console.error(error);
    } else {
    	console.log('mongo connected');
    	console.log('Server running on port', (process.env.PORT || 5000));
		app.listen(process.env.PORT || 5000);
    }
});

// Load app models
app.models = require('./models/models');

// Load the Routes
var routes = require('./routes');
_.each(routes, function (controller, route) {
	app.use(route, controller(app, route));
});

var Compra = mongoose.model('Compra', app.models.compra);
var User = mongoose.model('User', app.models.user);
var Token = mongoose.model('Token', app.models.token);

app.get('/', function (req, res) {
	res.send("SUCCESS!!");
});

// POST method route
app.post('/login', function(req, res) {
	User.find({ "name": req.body.user, "password": req.body.password }, function(err, user) {
		if (err) {
			res.send(false);
		} else {
			res.send((!_.isEmpty(user))? true:false);
		}
	});
});

// GET method route
app.get('/:user/get/range', function (req, res) {

	//Newest one
	Compra.findOne({}, {}, { sort: { 'date' : -1 } }, function(err, postnew) {
		//Oldest One
		Compra.findOne({}, {}, { sort: { 'date' : 1 } }, function(err, postold) {
			res.send([postold.date, postnew.date]);
		});
	});
});

// GET method route
app.get('/:user/get/range/:from/:to', function (req, res) {
	Compra.find({
			"date": {'$gte': new Date(parseInt(req.params.from)), '$lt': new Date(parseInt(req.params.to))},
			"user":  req.params.user
		}, function(err, users) {
		if (err) {
			res.send(err);
		} else {
			res.send(users);
		}
	});
});

// GET method route
app.get('/getServerTime/:date', function (req, res) {

	var serverdate = new Date(parseInt(req.params.date));

	var respon = "Server Date: "+serverdate.toString();

	res.send(respon);
});

// GET method route
app.get('/getServerTime', function (req, res) {

	var serverdate = new Date();

	var respon = "Server Date: "+serverdate.toString()+", Server TimeStamp: "+serverdate.getTime();

	res.send(respon);
});

// GET method route
app.get('/:user/get/group/:from/:to', function (req, res) {
	Compra.find({
			"date": {'$gte': new Date(parseInt(req.params.from)), '$lt': new Date(parseInt(req.params.to))},
			"user":  req.params.user
		},{},{
			sort:{
				date: 1 //Sort by Date Added DESC
			}
		}, function(err, users) {
		if (err) {
			res.send(err);
		} else {
			users = _.groupBy(users, function(o) {
			    return o.date;
			});

			var groupWithTotal = [];

			_.each(users, function(value, key) {
				var newGroup = {
					date: key,
					details: value,
					total: 0,
					outcomings: 0
				};

				_.each(value, function(obj, index) {
					newGroup.total += obj.price;
					if (obj.price < 0) {
						newGroup.outcomings += obj.price;
					}
				});

				groupWithTotal.push(newGroup);
			});

			res.send(groupWithTotal);
		}
	});
});

/*
**
**
**  	TOKEN HANDLERS   <------
**
**
*/

function sendCloudMessageReminder (res) {
	res = res? res : {
		send: function() {return;}
	};
	// See the "Defining the message payload" section below for details
	// on how to define a message payload.
	var payload = {
	  notification: {
	    title: "Recuerda cargar tus gastos del dia!",
	  	sound: "default"
	  }
	};

	/* timeToLive: in seconds */
	var options = {
	  priority: "high",
  	  timeToLive: 60 * 60 * 12
	};

	// Send a message to the device corresponding to the provided
	// registration token.
	Token.find({}, function(e, tokens) {
		if (e) {
			res.send(e);
		} else {
			if (!_.isEmpty(tokens)) {
				var arrTokens = [];
				_.each(tokens, function(o) {
					arrTokens.push(o.token);
				});
				admin.messaging().sendToDevice(arrTokens, payload, options)
				.then(function(response) {
					// See the MessagingDevicesResponse reference documentation for
					// the contents of response.
					console.log("Successfully sent message:", response);
					res.send(response);
				})
				.catch(function(error) {
					console.log("Error sending message:", error);
					res.send(error);
				});
			}
		}
	});
}

/*
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    |
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, OPTIONAL)
*/


var a = schedule.scheduleJob('*/4 * * * *', function(){
	console.log('----> You know what this does, and its being called. <----');
	try{
		http.get("http://comprasserver.herokuapp.com");
	} catch(e) {
		console.log(e);
	}
});

/* At the end of the day, send a reminder to load data! */
var b = schedule.scheduleJob('*/10 * * * *', function(){
	console.log('----> You know what this does, and its being called. <----');
	try{
		http.get("http://comprasserver.herokuapp.com");
	} catch(e) {
		console.log(e);
	}
});

/* At the end of the day, send a reminder to load data! */
var reminder = schedule.scheduleJob('0 21 * * *', function() {
  sendCloudMessageReminder();
});

// POST method route
app.post('/login', function(req, res) {
	User.find({ "name": req.body.user, "password": req.body.password }, function(err, user) {
		if (err) {
			res.send(false);
		} else {
			res.send((!_.isEmpty(user))? true:false);
		}
	});
});

app.get('/device/send', function(req, res) {
	sendCloudMessageReminder(res);
});

app.get('/device', function(req, res) {
	Token.find({}, function(err, tokens) {
		if (err) {
			res.send(false);
		} else {
			var response = 'Number of devices: '+tokens.length;
			res.send(response);
		}
	});
});
