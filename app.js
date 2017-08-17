var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongojs = require('mongojs');
var delay = require('express-delay');
var ejs = require('ejs');

var Stopwatch = require('timer-stopwatch');

var db = mongojs('test', ['timerdb']);

var app = express();

app.set('view engine', 'ejs');

//Used to setup mongodb connection
var sessionOptions = {
  secret: "secret",
  resave : true,
  saveUninitialized : false,
  store: new MongoStore({
    url:"mongodb://localhost/test",
    //other advanced options
  })
};

var options = {
    refreshRateMS: 1000,		// How often the clock should be updated
    //almostDoneMS: 10000, 	// When counting down - this event will fire with this many milliseconds remaining on the clock
};

var duration = 30000;

var timer = new Stopwatch(duration, options);
//app.locals.timeLeft = timer.ms;

app.get("/", function(req, res){
  console.log("Page Loaded...");
  console.log("Timer started");
  res.send("hello");

  db.timerdb.find(function (err, docs) {
    if(docs.length==0){
      console.log("No timers object in db");
      timer.start();
      db.timerdb.save({timervalue: timer.ms}, function(err, saved) {
        if( err || !saved )
          console.log("timer value not saved");
        //else
        //  console.log("timer saved");
      });
    }else{
        console.log("The timer is already running");
        //console.log(docs[0].timervalue);
    }
  });

  timer.onTime(function(time) {
    console.log("Time left : ", time.ms);
    db.timerdb.update({}, {$set: {timervalue: time.ms}}, function(err, updated) {
    if( err || !updated )
      console.log("timer not updated");
    //else
    //  console.log("time updated");
    });
  });

  timer.onDone(function(){
    db.timerdb.remove({timervalue: {$gte: 0} });
    timer.stop();
  });

});



app.listen(3000, function (){
  console.log("Server started at: http://localhost:3000");
});
