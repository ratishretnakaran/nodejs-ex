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
var channelsNewObj;
var programsIdMap = {};
var collectionItemCount = 0;

var cloudinary = require('cloudinary');

cloudinary.config({ 
  cloud_name: '', 
  api_key: '', 
  api_secret: '' 
});

//Startup functions
//prepareProgramsIDMap();
setTimeout(preparePgmDbList, 6000);

function preparePgmDbList(){
   

   var seconds = Math.floor(d.getTime()/1000);
   var exitLoop = false;
   var collectionExists = false

   fs.readFile('./jsons/v2/programsList.json', 'utf8', function (err, data) {
      if (err) throw err;
      dbObj = persistObj.getDB();

      dbObj.listCollections({name:'programDataBase'}).next(function(err, collInfo){
         if(!collInfo)
         {
            console.log("Doesn't it exists--creating one");
            programsList = JSON.parse(data);
            var pgmOffset = 0;
            for(var channelIndex in  channelsNewObj)
            {
               var programsForChannel = [];
               var programsOnNow = {};
               var startTime = seconds;
               collectionItemCount = collectionItemCount + 1;
               for (programIndex = 0; programIndex < 10; programIndex++)
               {   
                  program = programsList[programIndex + pgmOffset]
                  if (program){
                  program.details.startTimeSec = startTime.toString();
                  program.details.endTimeSec = (startTime + program.details.durationSec).toString();
                  startTime = (startTime + program.details.durationSec) + 1;
                  programsForChannel.push(program);
                  }else{
                     exitLoop = true;
                     break;
                  }
               }
               pgmOffset = pgmOffset + 10;
               programsOnNow = {"channelId":channelsNewObj[channelIndex].channelID, "programs":programsForChannel};
               dbObj.collection('programDataBase').save(programsOnNow, function(err, records){
                  if (err) throw err;
                  console.log("programs added to Channel",channelsNewObj[channelIndex].channelID);
               });
               if (exitLoop)
               {break;}
            }
         }
         else
         {
            setCount('programDataBase',function(err, count){
               if (err) throw err;
               collectionItemCount = count;
            });
         }
      });
      
      console.log("");
   //setInterval(updatePgmDbList, 2500);
   });      
}

//Function to set the count of collections
function setCount(collectionName, callback)
{
   dbObj = persistObj.getDB();
   dbObj.collection(collectionName).count({}, function(err, count){
      if (err) throw err;
      callback(null, count);
   });
}

fs.readFile('./jsons/v2/channelsv2.json', 'utf8', function (err, data) {
   channelsNewObj = JSON.parse(data);
   console.log("Prepared channelsNewObj");
});

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
router.post('/configuration',function(req, res){
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
   fs.readFile('./jsons/v1/entrypoint.json', 'utf8', function (err, data) {
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

//CHANNELS
router.get('/entrypoint/v1/channels',function(req, res){
   console.log("CHANNELS GET");    
   
   var obj;   
   fs.readFile('./jsons/v1/channels.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});

//ON NOW
router.get('/entrypoint/v1/programs/onnow',function(req, res){
   console.log("ON NOW GET");    
   
   var obj;   
   fs.readFile('./jsons/v1/onnowprograms.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});


//PROGRAM DETAIL
router.get('/entrypoint/v1/event',function(req, res){
   console.log("EVENT DETAIL GET");    
   
   var obj;   
   fs.readFile('./jsons/v1/eventdetail.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});


// router.post('/uploadlogos',function(req, res){
//    console.log("UPLOAD IMAGES");
// 
//    fs.readFile('./jsons/channelsv2.json', 'utf8', function (err, data) {
//    if (err) throw err;
//    onNowObj = JSON.parse(data);
//    if (onNowObj)
//    {
//       for(var tmsid in onNowObj)
//       {
//          var channel = onNowObj[tmsid]
//          var imageSourceUrl = channel.networkLogo + "?colorHybrid=true&height=100&width=100";
//          console.log("imageSourceUrl :", imageSourceUrl);
//          var cloudinaryPath = "imageserver/network/"+channel.channelID
//          console.log("cloudinaryPath :", cloudinaryPath);
//          cloudinary.v2.uploader.upload(imageSourceUrl, {use_filename: true, public_id: cloudinaryPath},
//          function(error, result){console.log(result)});   
//       }
//    }
//    });
//    res.writeHead(200, {'Content-Type': 'text/plain'});
//    res.end('Got Post Data');
// });

//MORE REALTIME DATA COMING FROM THE EPG PROGRAMS.

//ENTRY POINT
router.get('/entrypoint/v2',function(req, res){
   console.log("ENTRY POINT GET V2");    
   
   var obj;   
   fs.readFile('./jsons/v2/entrypointv2.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});

//MAIN MENU
router.get('/entrypoint/v2/mainmenu',function(req, res){
   console.log("MAIN MENU GET V2");    
   
   var obj;   
   fs.readFile('./jsons/mainmenu.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});

//CHANNELS
router.get('/entrypoint/v2/channels',function(req, res){
   console.log("CHANNELS GET V2");    
   
   var obj;   
   fs.readFile('./jsons/v2/channelsv2.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});

//ENTRY POINT V2
router.get('/entrypoint/v2/programs/onnow',function(req, res){
   console.log("ENTRY POINT GET V2");    

   prepareProgramsOnNow(res, onProgramNowAvailable);
});

function prepareProgramsOnNow(res, callback)
{
   var programsOnNow = {};
   dbObj = persistObj.getDB();
   var count = 0;
   var pgmDBCollectionCount = dbObj.collection('programDataBase').find().count();

    dbObj = persistObj.getDB();
   dbObj.collection('programDataBase').find().forEach(function(doc){
      programsOnNow[doc.channelId] = doc.programs.slice(0,3);
      count = count + 1;
      console.log(count,collectionItemCount);
      if (count == collectionItemCount)
      {
         callback(res, programsOnNow);
      }
         
   });

}

function onProgramNowAvailable(res, programsOnNow)
{
   res.send(programsOnNow);
}

router.get('/entrypoint/v2/schedule/:channelId', function(req, res){

   console.log(req.params.channelId);
   dbObj = persistObj.getDB();
   var col = dbObj.collection('programDataBase');

   // Show that duplicate records got dropped

   col.find({channelId:req.params.channelId}).toArray(function(err, items) {
   if(err) throw err;
   if (items[0])
   {
      res.send(items[0].programs);
   }else{
      res.send({});
   }
   });
   
});


module.exports = router;