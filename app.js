var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var redis = require("redis");
var subscriber = redis.createClient();
var publisher = redis.createClient();
var cors = require("cors");
var bodyParser = require("body-parser");

var currentX = "0";
var currentY = "0";

//This event is executed every time a message arrives on a channel
subscriber.on("message", function(channel, message) {
    //If the message comes from x or y axis channel, the value is stored in the corresponding variable
    if(channel == "x"){
      currentX = message;
    }
    if(channel == "y"){
      currentY = message;
    }
    console.log("Message '" + message + "' on channel '" + channel + "' arrived!")
});

//Start the subscription to all channels
subscriber.subscribe("x");
subscriber.subscribe("y");
subscriber.subscribe("xHigh");
subscriber.subscribe("xLow");
subscriber.subscribe("yHigh");
subscriber.subscribe("yLow");
subscriber.subscribe("stopX");
subscriber.subscribe("startX");
subscriber.subscribe("stopY");
subscriber.subscribe("startY");

var app = express();

//This is to avoid problems with connection
app.use(cors());

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//This sends to c# the x range
app.post('/api/setx', function(req,res){
    console.log("Sending x bounds");
    publisher.publish("xHigh", req.body.highBound);
    publisher.publish("xLow", req.body.lowBound);
    res.send({status: 'ok'});
});

//This sends to c# the y range
app.post('/api/sety', function(req,res){
  console.log("Sending y bounds");
  publisher.publish("yHigh", req.body.highBound);
  publisher.publish("yLow", req.body.lowBound);
  res.send({status: 'ok'});
});

//Starts the X axis value generation in C#
app.post('/api/startx', function(req,res){
  console.log("Starting generate");
  publisher.publish("startX", "");
  res.send({status: 'ok'});
});

//Stop the X axis value generation in C#
app.post('/api/stopx', function(req,res){
  console.log("Stopping generate");
  publisher.publish("stopX", "");
  res.send({status: 'ok'});
});

//Starts the Y axis value generation in C#
app.post('/api/starty', function(req,res){
  console.log("Starting generate");
  publisher.publish("startY", "");
  res.send({status: 'ok'});
});

//Stop the Y axis value generation in C#
app.post('/api/stopy', function(req,res){
  console.log("Stopping generate");
  publisher.publish("stopY", "");
  res.send({status: 'ok'});
});

//This sends to web UI the current X axis value
app.get('/api/getx', function(req,res){
  console.log("Getting x value");
  res.send({value: currentX});
});

//This sends to web UI the current Y axis value
app.get('/api/gety', function(req,res){
  console.log("Getting y value");
  res.send({value: currentY});
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
