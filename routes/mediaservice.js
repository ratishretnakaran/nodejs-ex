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
   setInterval(reSchedulePrograms, 1800000);
   
   fs.readFile('./jsons/v2/programsListV2.json', 'utf8', function (err, data) {
      if (err) throw err;
      dbObj = persistObj.getDB();

      dbObj.listCollections({name:'programDataBase'}).next(function(err, collInfo){
         if(!collInfo)
         {
            console.log("programDataBase doesn't exists--creating one");
            programsList = JSON.parse(data);
            var pgmOffset = 0;
            for(var channelIndex in  channelsNewObj)
            {
               var programsForChannel = [];
               var programsOnNow = {};
               var startTime = seconds;
               collectionItemCount = collectionItemCount + 1;
               for (programIndex = 0; programIndex < 30; programIndex++)
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
               pgmOffset = pgmOffset + 30;
               programsOnNow = {"channelId":channelsNewObj[channelIndex].channelID, "programs":programsForChannel};
               dbObj.collection('programDataBase').save(programsOnNow, function(err, records){
                  if (err) throw err;
                  console.log("programs added to Channel",channelsNewObj[channelIndex].channelID);
               });
               if (exitLoop)
               {
                  prepareEventDetailsDb();
                  break;
               }
            }
         }
         else
         {
            setCount('programDataBase',function(err, count){
               if (err) throw err;
               collectionItemCount = count;
            });
            prepareEventDetailsDb();
         }
      });
      
      console.log("");
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

//Create Program details DB
function prepareEventDetailsDb()
{
   dbObj = persistObj.getDB();

   dbObj.listCollections({name:'programDetailsDataBase'}).next(function(err, collInfo){
      if(!collInfo)
      {
         console.log("programDetailsDataBase DB doesn't exist--creating one");

         fs.readFile('./jsons/eventDetails.json', 'utf8', function (err, data) {
            programDetailsArray = JSON.parse(data);
            for (var index in programDetailsArray)
            {
               dbObj.collection('programDetailsDataBase').save(programDetailsArray[index], function(err, records){
                  if (err) throw err;
               });
            }
         });

      }else {
         console.log("programDetailsDataBase already exists!!");
      }
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


router.get('/entrypoint/v2/event/:programID',function(req, res){
   console.log("EVENT DETAIL GET");    
   
   dbObj = persistObj.getDB();
   var col = dbObj.collection('programDetailsDataBase');
   //ProgramsDetail is taken from programDetailsDataBase
   console.log("Fetching event details");
   col.find({"details.programID":req.params.programID},{_id:0}).toArray(function(err, items) {
   if(err) throw err;
   if (items[0])
   {
      pgmId = items[0].details.programID;
      dbObj.collection('programDataBase').find({"programs.details.programID":pgmId},{"channelId":1,"programs.details.$":1,_id:0}).toArray(function(err,dataArray){
         if(err) throw err;
         console.log(pgmId);
         if(dataArray[0])
         {
            startTime = dataArray[0].programs[0].details.startTimeSec;
            endTime = dataArray[0].programs[0].details.endTimeSec;
            items[0].details.offering[0].startTimeSec = startTime;
            items[0].details.offering[0].endTimeSec = endTime;
            res.send(items[0]);
         }
         else {
            res.send(items[0]);
         }
      });
   }else{
      console.log("No details exit for the programId");
      res.send({});
   }
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

router.get('/entrypoint/v2/epg', function(req, res){
   console.log("req.query.channels :", req.query.channels);
   dbObj = persistObj.getDB();
   var col = dbObj.collection('programDataBase');
   var channelIDs = req.query.channels.split(',');
   var startTime = parseInt(req.query.startTime);
   var endTime = parseInt(req.query.endTime);
   //pick all channels with the channel IDs
   // Show that duplicate records got dropped
   var channelsCount = channelIDs.length;
   console.log("channelsCount : ", channelsCount);
   var epgData = {};
   var count = 0;

   for(var channelIdIndex in channelIDs)
   {
        var channelID = channelIDs[channelIdIndex];
        console.log("channelID : ", channelID);
        col.find({channelId:channelID}).toArray(function(err, items) {
            if(err) throw err;            
            count = count + 1;
            if (items[0])
            {   
               var programsArray = [];
               for(i=0;i<items[0].programs.length;i++)
               {
                  if((parseInt(items[0].programs[i].details.startTimeSec) < endTime) && (parseInt(items[0].programs[i].details.endTimeSec) > startTime))
                  {
                     programsArray.push(items[0].programs[i]);
                  }
               }
                epgData[items[0].channelId] = programsArray;
            }
            if( count == channelsCount)
            {   
                // console.log("SENDING DATA AT items[0].channelId: ", items[0].channelId ,count);
                res.send(epgData);
            }
       });
   }
      
});

function reSchedulePrograms()
 {
     var currentDateTime = new Date(); 
     var currentTimeSec = Math.floor(currentDateTime.getTime()/1000);
     var lastProgram;
     var shiftedProgram;
     dbObj = persistObj.getDB();
   console.log("[x][1][1]--Running ReSchedule--[1][1][x]",currentTimeSec);
   dbObj.collection('programDataBase').find().forEach(function(doc){
      var programArray = doc.programs;
      programEndTimeInt = parseInt(programArray[0].details.endTimeSec)
      if (programEndTimeInt < currentTimeSec)
      {
         shiftedProgram = programArray.shift();
         console.log("PROGRAM EXPIRED WITH TITLE: shiftedProgram.details.title: ", shiftedProgram.details.title);
         lastProgram = programArray[programArray.length-1];
         //Update the startTime and EndTime the the shifted program
         shiftedProgram.details.startTimeSec = (parseInt(lastProgram.details.endTimeSec) + 1).toString();
         shiftedProgram.details.endTimeSec = (parseInt(shiftedProgram.details.startTimeSec) + shiftedProgram.details.durationSec).toString();
         programArray.push(shiftedProgram);
         console.log("Rescheduled");
         dbObj.collection('programDataBase').update({"channelId":doc.channelId}, {$set:{"programs":programArray}});
      }
   });
 }


 router.get('/entrypoint/v2/programs/resettime',function(req, res){
    console.log("ENTRY POINT GET V2");    

    resetProgramTimes(res, onResetDone);
 });
 
 function onResetDone(res)
 {
    res.send("RESET COMPLETE"); 
 }

 function resetProgramTimes(res, callback)
 {
    var currentDateTime = new Date();    
    var seconds = Math.floor(currentDateTime.getTime()/1000); 
    dbObj = persistObj.getDB();
    var count = 0;
    var pgmDBCollectionCount = dbObj.collection('programDataBase').find().count();
    dbObj = persistObj.getDB();
    dbObj.collection('programDataBase').find().forEach(function(doc){
        var programs = doc.programs;
        for(var programIndex in programs)
        {
            program = programs[programIndex];
            if(programIndex == 0)
            {
                startTime = seconds;
                program.details.startTimeSec = startTime.toString();
                program.details.endTimeSec = (startTime + program.details.durationSec).toString();
                startTime = (startTime + program.details.durationSec) + 1;
            }
            else
            {
                program.details.startTimeSec = startTime.toString(); //use previously calculated StartTime
                program.details.endTimeSec = (startTime + program.details.durationSec).toString();
                startTime = (startTime + program.details.durationSec) + 1;
            }
        }
        dbObj.collection('programDataBase').update({"channelId":doc.channelId}, {$set:{"programs":programs}});
        count = count + 1;
        console.log(count, collectionItemCount);
        if (count == collectionItemCount)
        {
          callback(res);
        }
    });

 }

module.exports = router;