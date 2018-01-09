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

var cloudinary = require('cloudinary');

cloudinary.config({ 
  cloud_name: '', 
  api_key: '', 
  api_secret: '' 
});

//Startup functions
//prepareProgramsIDMap();

fs.readFile('./jsons/channelsv2.json', 'utf8', function (err, data) {
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

//CHANNELS
router.get('/entrypoint/v1/channels',function(req, res){
   console.log("CHANNELS GET");    
   
   var obj;   
   fs.readFile('./jsons/channels.json', 'utf8', function (err, data) {
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

//UPDATE PROGRAMS
router.post('/entrypoint/v1/programs/onnow/update',function(req, res){
   console.log("ON NOW GET");    
   
   //first check if there is a collection for onnow programs
   dbObj = persistObj.getDB()        
   if (dbObj)
   {
      console.log("DB EXISTS")
      //var ObjectId = require('mongodb').ObjectID;
      var onNowCollection = dbObj.collection('onnowprograms')
      if (onNowCollection)
      {
         console.log("onNowCollection EXISTS....");
         //console.log(onNowCollection);
         onnowProgramsCount = onNowCollection.count();
         if (onnowProgramsCount > 0)
         {
            console.log("ONNOW PROGRAMS NOT FOUND: ");
         }
         else
         {
            console.log("ONNOW PROGRAMS NOT FOUND: ");
            var obj;   
            fs.readFile('./jsons/onnowprograms.json', 'utf8', function (err, data) {
            if (err) throw err;
            onNowObj = JSON.parse(data);
            if (onNowObj)
            {
               console.log("Saving the ONNOW object");
               dbObj.collection('onnowprograms').save(onNowObj, function(err, records){
               if (err) throw err;
               console.log("ONNOW Added");
               });
            }
            });
         }
      }
   }
   else
   {
      console.log("NO DB FOUND");
   }
   
   res.writeHead(200, {'Content-Type': 'text/plain'});
   res.end('Got Post Data');
});

//Uplaod an image to cloudinary
// router.post('/upload',function(req, res){
//    console.log("UPLOAD IMAGES");
// 
//    fs.readFile('./jsons/epgPrograms.json', 'utf8', function (err, data) {
//    if (err) throw err;
//    onNowObj = JSON.parse(data);
//    if (onNowObj)
//    {
//       for(var tmsid in onNowObj)
//       {
//          var programs = onNowObj[tmsid]
// 
//          for(var index in programs)
//          {  
//             var program = programs[index];
//             var imageSourceUrl = "your source URL" + program.details.programID;
//             console.log("imageSourceUrl :", imageSourceUrl);
//             var cloudinaryPath = "imageserver/program/"+program.details.programID
//             console.log("cloudinaryPath :", cloudinaryPath);
//             cloudinary.v2.uploader.upload(imageSourceUrl, {use_filename: true, public_id: cloudinaryPath},
//             function(error, result){console.log(result)});   
//          } 
//       }
//    }
//    });
//    res.writeHead(200, {'Content-Type': 'text/plain'});
//    res.end('Got Post Data');
// });

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

router.post('/prepareChannels',function(req, res){
   console.log("UPLOAD IMAGES");
   
   var jsonData = [];
   
   fs.readFile('./jsons/epgPrograms.json', 'utf8', function (err, data) {
      if (err) throw err;
      onNowObj = JSON.parse(data);
   
   
      if (onNowObj)
      {
         for(var tmsid in onNowObj)
         {
            console.log("programs tmsid : ", tmsid);
            for(var channelIndex in  channelsNewObj)
            {
               var channelTMSID = channelsNewObj[channelIndex].channelID;
               if( channelTMSID ==  tmsid )
               {
                  console.log("MATCH FOUND FOR CHANNEL: ", channelTMSID);
                  jsonData.push(channelsNewObj[channelIndex]);
                  break;
               }
            }
         }
         
         console.log("jsonData :", jsonData);
      }
   });
   
   res.writeHead(200, {'Content-Type': 'text/plain'});
   res.end('Got Post Data');
});

//MORE REALTIME DATA COMING FROM THE EPG PROGRAMS.

//ENTRY POINT
router.get('/entrypoint/v2',function(req, res){
   console.log("ENTRY POINT GET V2");    
   
   var obj;   
   fs.readFile('./jsons/entrypointv2.json', 'utf8', function (err, data) {
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
   fs.readFile('./jsons/channelsv2.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});

//ENTRY POINT V2
router.get('/entrypoint/v2/programs/onnow',function(req, res){
   console.log("ENTRY POINT GET V2");    
   prepareProgramsOnNow(res);
});

function prepareProgramsOnNow(res)
{
   var programsOnNow = {};
   
   fs.readFile('./jsons/programsList.json', 'utf8', function (err, data) {
      if (err) throw err;
      
      programsList = JSON.parse(data);
      var pgmOffset = 0;
      for(var channelIndex in  channelsNewObj)
      {
         var programsForChannel = [];
            
         var programCounter = 0;
         for (programIndex = 0; programIndex < 3; programIndex++)
         {  
            programsForChannel.push(programsList[programIndex + pgmOffset]);
         }
         pgmOffset = pgmOffset + 3;
         programsOnNow[channelsNewObj[channelIndex].channelID] = programsForChannel;
      }
      
      console.log("programsOnNow :", programsOnNow);
      res.send(programsOnNow);
   });      
}


//This function should be called say every 4 hours or when 
// function prepareProgramSchedules(res)
// {
//    var programsOnNow = {};
// 
//    fs.readFile('./jsons/programsList.json', 'utf8', function (err, data) {
//       if (err) throw err;
// 
//       programsList = JSON.parse(data);
//       var pgmOffset = 0;
//       for(var channelIndex in  channelsNewObj)
//       {
//          var programsForChannel = [];
// 
//          var programCounter = 0;
//          for (programIndex = 0; programIndex < 3; programIndex++)
//          {  
//             programsForChannel.push(programsList[programIndex + pgmOffset]);
//          }
//          pgmOffset = pgmOffset + 3;
//          programsOnNow[channelsNewObj[channelIndex].channelID] = programsForChannel;
//       }
// 
//       console.log("programsOnNow :", programsOnNow);
//       res.send(programsOnNow);
//    });
// }

// function prepareProgramsIDMap()
// {
//    fs.readFile('./jsons/programsList.json', 'utf8', function (err, data) {
//       if (err) throw err;
// 
//       programsList = JSON.parse(data);
//       for (var programIndex in programsList)
//       {  
//          console.log("programIndex :", programIndex);
//          programsIdMap[programsList[programIndex].programID] = programsList[programIndex];
//       }
//       console.log("programsIdMap :", programsIdMap);
//    });   
// }

module.exports = router;