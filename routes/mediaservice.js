//Media Services APIS' a exposed in here
var express = require('express')
var router = express.Router()

var persistObj = require('../dbconnection.js')
//var imdbModule = require('./imdbModule.js')

//variants for movie json
var d = new Date()
var currdate;
var movieDetailsJson = {};
var curr_date = d.getDate();
var curr_month = d.getMonth() + 1; //Months are zero based
var curr_year = d.getFullYear();
currdate = curr_year+ "-" + curr_month + "-" + curr_date;
var fs = require('fs');


// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now())
  next()
})

//ACTORS
//GET ACTORS
router.get('/actors', function (req, res) {
    console.log("are u asking for actors?? ");    
    dbObj = persistObj.getDB()        
    if (dbObj)
    {
        dbObj.collection('actors').aggregate( ).toArray(function(err, result){
            console.log("printing result: ", result);  
            res.send(result);     
        });  
    } 
    else
    {   
        console.log("dbObj is INVALID");  
    }
});


//ADD an ACTOR
router.put('/actor', function (req, res) {
    console.log("PUT request Recieved for Actor")
    console.log("actor info to be added", req.body);   
    
    dbObj = persistObj.getDB()        
    if (dbObj)
    {
        console.log("Saving the JSON Body")
        dbObj.collection('actors').save(req.body, function(err, records){
            if (err) throw err;
            console.log("record added");
        });
    }
    else
    {
        console.log("NO DB FOUND");
    }
    
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Got Post Data');
});

//DELETE ACTOR BY ID
router.delete('/actor', function (req, res) {
    console.log("DELETE ACTOR request Recieved")
    console.log("actor id to be deleted: ", req.query.id);   
    dbObj = persistObj.getDB()        
    if (dbObj)
    {
        console.log("Deleting the entry")
        var ObjectId = require('mongodb').ObjectID;
        dbObj.collection('actors').deleteMany(
            {"_id":ObjectId(req.query.id)}, function(err, results){
            if (err) throw err;
            console.log("record deleted");
            res.send(results);
        });
    }
    else
    {
        console.log("NO DB FOUND");
    }
});

router.get('/latestMovies',function(req, res){
    // imdbModule.getLatestMovies(currdate,function(movieResults){
    //     console.log("latest Movies");
    //     moviesResponse = {results:movieResults}    
    //     res.json(moviesResponse);
    // });
    console.log("latest Movies service end of block");    
});

//CONFIGURATION
router.get('/configuration',function(req, res){
   console.log("CONFIGURATION GET");    
   
   var obj;   
   fs.readFile('./jsons/configuration.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});

//ENTRY POINT
router.get('/entrypoint/v1',function(req, res){
   console.log("ENTRY POINT GET");    
   
   var obj;   
   fs.readFile('./jsons/entrypoint.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});

//MAIN MENU
router.get('/entrypoint/v1/mainmenu',function(req, res){
   console.log("MAIN MENU GET");    
   
   var obj;   
   fs.readFile('./jsons/mainmenu.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});


//ON NOW
router.get('/entrypoint/v1/programs/onnow',function(req, res){
   console.log("ON NOW GET");    
   
   var obj;   
   fs.readFile('./jsons/onnowprograms.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});


//PROGRAM DETAIL
router.get('/entrypoint/v1/event',function(req, res){
   console.log("EVENT DETAIL GET");    
   
   var obj;   
   fs.readFile('./jsons/eventdetail.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});

module.exports = router;