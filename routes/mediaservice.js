//Media Services APIS' a exposed in here
var express = require('express')
var router = express.Router()
var async = require('async');

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
var programsList;
var request = require('request').defaults({ encoding: null });
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
      programsList = JSON.parse(data);
      dbObj.listCollections({name:'programDataBase'}).next(function(err, collInfo){
         if(!collInfo)
         {
            console.log("programDataBase doesn't exists--creating one");
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
         prepareSuggestedMap();
      }else {
         prepareSuggestedMap();
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

function prepareSuggestedMap()
{
   console.log("Preparing Suggested Map");
   dbObj = persistObj.getDB();
   dbObj.listCollections({name:'suggestedMapDB'}).next(function(err, collInfo){
      if(!collInfo)
      {
         for(var index in programsList)
         {
            program = programsList[index];
            var suggested = {};
            suggestedProgramIds = [];
            for(i = 0;i < 4;i++)
            {
               suggestedObjId = programsList[Math.floor((Math.random() * 413) + 1)].details.programID;
               suggestedProgramIds.push(suggestedObjId);
            }
            suggested["programID"] = program.details.programID;
            suggested["map"] = suggestedProgramIds;
            dbObj.collection('suggestedMapDB').save(suggested, function(err, records){
               if(err) throw err;
            });
         }
         console.log("Suggested Map Db created");
      }else{
         console.log("Suggested Map Db created");
      }
   });

}
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

router.get('/images/:category/:options/:image',function(req,res){

   category = req.params.category;
   var url;
   if(category == "mainmenu")
   {
      url = "http://res.cloudinary.com/dte07foms/image/upload/v1512643992/mainmenu/v2/"+req.params.options+"/"+req.params.image;
   }
   else if(category == "imageserver")
   {
      url = "http://res.cloudinary.com/dte07foms/image/upload/v1515162152/imageserver/"+req.params.options+"/"+req.params.image;
   }
   request.get(url, function(err,response,body){
      if (response && response.headers)
      {
         data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
         var im = data.split(",")[1];
         var img = new Buffer(im, 'base64');
         res.writeHead(200, {
            'Content-Type': response.headers["content-type"],
            'Content-Length': img.length
         });
         res.end(img,'binary');
      }
      else {
         res.writeHead(200,{});
         res.end();
      }
   });
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

router.get('/entrypoint/v2/event/:programID',function(req, res){
   console.log("EVENT DETAIL GET V2");

   dbObj = persistObj.getDB();
   var col = dbObj.collection('programDetailsDataBase');
   count = 0;
   //ProgramsDetail is taken from programDetailsDataBase
   dbObj.collection('suggestedMapDB').find({"programID":req.params.programID},{_id:0}).toArray(function(err, map){
      if(err) throw err;
      if(map[0])
      {
         suggestedIds = map[0].map;
         suggestedArray = [];
         for(var index in suggestedIds)
         {
            dbObj.collection('programDataBase').find({"programs.details.programID":suggestedIds[index]},{"channelId":1,"programs.details.$":1,_id:0}).toArray(function(err,dataArray){
               count = count + 1;
               console.log(dataArray[0],count);
               suggestedArray.push(dataArray[0].programs[0]);
               if(count == 3)
               {
                  col.find({"details.programID":req.params.programID},{_id:0}).toArray(function(err, items) {
                     if(err) throw err;
                     if (items[0])
                     {
                        var pgmId = items[0].details.programID;
                        var castNCrewsObj = items[0].details.castAndCrews
                        if( castNCrewsObj == null )
                        {
                            items[0].details["castAndCrews"] = [];
                        }
                        dbObj.collection('programDataBase').find({"programs.details.programID":pgmId},{"channelId":1,"programs.details.$":1,_id:0}).toArray(function(err,dataArray){
                           if(err) throw err;
                           console.log(pgmId);
                           if(dataArray[0])
                           {
                              if(dataArray[0].programs[0].details.programType)
                              {
                                 items[0].details.programType = dataArray[0].programs[0].details.programType;
                              }
                              startTime = dataArray[0].programs[0].details.startTimeSec;
                              endTime = dataArray[0].programs[0].details.endTimeSec;
                              items[0].details.imageUrl = "http://res.cloudinary.com/dte07foms/image/upload/v1510918394/imageserver/program/iconic/"+items[0].details.programID;
                              items[0].details.offering[0].startTimeSec = startTime;
                              items[0].details.offering[0].endTimeSec = endTime;
                              if(items[0].details.offering && items[0].details.offering[0].eventType == "linear")
                              {
                                 items[0].details.actions[0].actionType = "watch"
                              }
                              if(items[0].details.shortDescription && items[0].details.longDescription)
                              {
                                 if(items[0].details.shortDescription.length < items[0].details.longDescription.length)
                                 {
                                    items[0].details.actions[1].actionType = "moreinfo"
                                 }
                              }
                              items[0].details.suggested = suggestedArray;
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
               }
            });

         }
      }else{
         console.log("No details exit for the programId in suggestedMapDB",req.params.programID);
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

//ENTRY POINT V3
router.get('/entrypoint/v3',function(req, res){
   console.log("ENTRY POINT GET V3");

   var obj;
   fs.readFile('./jsons/v3/entrypointv3.json', 'utf8', function (err, data) {
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

//MAIN MENU V3
router.get('/entrypoint/v3/mainmenu',function(req, res){
   console.log("MAIN MENU GET V3");

   var obj;
   fs.readFile('./jsons/v3/mainmenuv3.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);
      res.send(obj);
   });
});

//CHANNELS
router.get('/entrypoint/v2/channels',function(req, res){
   console.log("CHANNELS GET V2");
   var filterType = req.query.filterType;
   var obj;

   fs.readFile('./jsons/v2/channelsv2.json', 'utf8', function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);

      if (filterType)
      {
         var filteredChannelArray = [];
         var filters = [];
         for(i=0;i<obj.length;i++)
         {
            filters = obj[i].filters
            console.log("the filters are", filters)
            if (filters)
            {
               for(j=0;j<filters.length;j++)
               {
                  if(filters[j] == filterType)
                  {
                     filteredChannelArray.push(obj[i]);
                  }
               }
            }
            else
            {
               console.log("No Filters for the Channel", obj[i].channelNumber)
            }
         }
         res.send(filteredChannelArray);
      }
      else
      {
         res.send(obj);
      }
   });
});

router.get('/entrypoint/v2/filters', handleFilter);

function handleFilter(req, res)
{
   console.log("LIVEFILERS GET V2");

   var filterObj;
   var channelObj;
   var moviesCount = 0;
   var sportsCount = 0;
   var newsCount = 0;
   var cartoonCount = 0;
   var musicCount = 0;
   var educationCount = 0;
   var devotionalCount = 0;
   var totalChannelCount = 0;

   async.waterfall([
      function(callback){
         fs.readFile('./jsons/v2/channelsv2.json', 'utf8', function (err, data) {
            if (err) throw err;
            channelObj = JSON.parse(data);
            console.log("done with channelObj creation");
            callback(null, channelObj);
         });
      },
      function(callback){
         fs.readFile('./jsons/v2/liveFilters.json', 'utf8', function (err, data) {
            if (err) throw err;
            filterObj = JSON.parse(data);
            console.log("done with filterObj creation");
            if (channelObj)
            {
               for(i=0;i<channelObj.length;i++)
               {
                  channel = channelObj[i];
                  totalChannelCount++;
                  if (channel.filters)
                  {
                     for(j=0;j<channel.filters.length;j++)
                     {
                        if (channel.filters[j] == "movies")
                        {
                           moviesCount++;
                        }
                        else if (channel.filters[j] == "sports")
                        {
                           sportsCount++;
                        }
                        else if (channel.filters[j] == "news")
                        {
                           newsCount++;
                        }
                        else if (channel.filters[j] == "cartoon")
                        {
                           cartoonCount++;
                        }
                        else if (channel.filters[j] == "music")
                        {
                           musicCount++;
                        }
                        else if (channel.filters[j] == "education")
                        {
                           educationCount++;
                        }
                        else if (channel.filters[j] == "devotional")
                        {
                           devotionalCount++;
                        }
                     }
                  }
               }
            }
            for(i=0;i<filterObj.length;i++)
            {
               if (filterObj[i].type == "all")
               {
                  filterObj[i].filteredChannelCount = totalChannelCount;
               }
               else if (filterObj[i].type == "movies")
               {
                  filterObj[i].filteredChannelCount = moviesCount;
               }
               else if (filterObj[i].type == "sports")
               {
                  filterObj[i].filteredChannelCount = sportsCount;
               }
               else if (filterObj[i].type == "news")
               {
                  filterObj[i].filteredChannelCount = newsCount;
               }
               else if (filterObj[i].type == "cartoon")
               {
                  filterObj[i].filteredChannelCount = cartoonCount;
               }
               else if (filterObj[i].type == "music")
               {
                  filterObj[i].filteredChannelCount = musicCount;
               }
               else if (filterObj[i].type == "education")
               {
                  filterObj[i].filteredChannelCount = educationCount;
               }
               else if (filterObj[i].type == "devotional")
               {
                  filterObj[i].filteredChannelCount = devotionalCount;
               }
            }
            res.send(filterObj);
      });
   }]);
}

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


 router.get('/entrypoint/v2/ondemand',function(req, res){
    async.waterfall([
        function(callback){
            dbObj = persistObj.getDB();
            dbObj.collection('programDetailsDataBase').aggregate().toArray(function(err, result){
                callback(null, result);
            });
        },
        function(programList, callback){
            var totalPrograms = programList.length;
            console.log("totalPrograms: ", totalPrograms);
            fs.readFile('./jsons/v2/ondemandFilters.json', 'utf8', function (err, data) {
               if (err) throw err;
               ondemandFilterObj = JSON.parse(data);
               for( var filterIndex in ondemandFilterObj)
               {
                    var filteredProgram = [];
                    var filterObj = ondemandFilterObj[filterIndex];
                    //find the type and based on it prepare the list
                    var filterType = filterObj.type;

                    var programCount = 0;
                    for(var index in programList)
                    {
                       var randomIndex = Math.floor((Math.random() * (totalPrograms - 1)) + 1);
                       var program = programList[randomIndex];

                       if(filterType == "Potrait") //movie type
                       {
                           if( program.eventType == "MOVIE")
                           {
                               delete program["_id"];
                               program.details.imageUrl = "http://res.cloudinary.com/dte07foms/image/upload/c_scale,h_317,w_211/v1510918394/imageserver/program/" + program.details.programID;
                               filteredProgram.push(program);
                               programCount++;
                               if(programCount > 5)
                               {
                                   break;
                               }
                           }
                       }
                       else
                       {
                           var filterContext = filterObj.context;
                           if( filterContext == "categories")
                           {
                                break;
                           }
                           else
                           {
                               if( program.eventType == "EPISODE")
                               {
                                   delete program["_id"];
                                   //change the imageUrl path to hold iconic
                                   program.details.imageUrl = "http://res.cloudinary.com/dte07foms/image/upload/c_scale,h_180,w_321/v1510918394/imageserver/program/iconic/" + program.details.programID;
                                   filteredProgram.push(program);
                                   programCount++;
                                   if(programCount > 5)
                                   {
                                       break;
                                   }
                               }
                           }
                       }
                    }

                    filterObj["assets"] = filteredProgram;
               }
               res.send(ondemandFilterObj);
               callback(null, "ONDEMAND REQUEST PROCESSED....")
            });
        }
    ],
    function (err,result) {
    console.log(result)
    });

 });


module.exports = router;
