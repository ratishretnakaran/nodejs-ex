//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');

var persistObj = require('./dbconnection.js')
var mediaservice = require('./routes/mediaservice.js')
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies

app.use(express.static('public'));  

//ROUTE MEDIA SERVICE CALL: example: http://127.0.0.1:8888/mediaservice/actors
app.use('/mediaservice', mediaservice)


app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  // if (!db) {
  //   initDb(function(err){});
  // }
  // if (db) {
  //   var col = db.collection('counts');
  //   // Create a document with request IP and current time of request
  //   col.insert({ip: req.ip, date: Date.now()});
  //   col.count(function(err, count){
  //     if (err) {
  //       console.log('Error running count. Message:\n'+err);
  //     }
  //     res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
  //   });
  // } else {
    res.render('index.html', { pageCountMessage : null});
  // }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

//SERVER'
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8888,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

//var port = 8888,
   // ip   = '0.0.0.0';

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

persistObj.initDb(function(err){    
})

//START SERVER
app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
