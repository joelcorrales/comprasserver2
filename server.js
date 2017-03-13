var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var _ = require('lodash');
var schedule = require('node-schedule');


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

//console.log(process.env);

/*
	We only need to keep athis server awake for the 9pm notification. After that it can be idle as long as it wants.
	We have 17hours top per day.

	16-23 server

	00-15 waker
*/
var wakerworker,
	changer;

var waker = {
	start: function (argument) {
		var that = this;
		wakerworker = schedule.scheduleJob('*/4 * * * *', function(){
			console.log('----> You know what this does, and its being called. <----');
			try{
				http.get("http://comprasserver2.herokuapp.com");
			} catch(e) {
				console.log(e);
			}
		});

		changer = schedule.scheduleJob('0 * * * *', function() {
		  var time = new Date();

		  if (time.getHours() > 15) {
		  	that.stop();
		  }
		});
	},
	stop: function (argument) {
		wakerworker.cancel();
		changer.cancel();
		http.get("http://comprasserver.herokuapp.com/app/start");
	}
};

app.get('/', function (req, res) {
	res.send('Im working master!!!!');
});

app.get('/app/wakeup', function (req, res) {
	waker.start();

	res.send('Im awake!!!');
});


console.log('Server running on port', (process.env.PORT || 6000));
app.listen(process.env.PORT || 6000);