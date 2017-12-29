var mongoURL = 'mongodb://localhost:27017/test';
//var mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
//    mongoURLLabel = "";
var db = null;

// if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
//   var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
//       mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
//       mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
//       mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
//       mongoPassword = process.env[mongoServiceName + '_PASSWORD']
//       mongoUser = process.env[mongoServiceName + '_USER'];
// 
//   if (mongoHost && mongoPort && mongoDatabase) {
//     mongoURLLabel = mongoURL = 'mongodb://';
//     if (mongoUser && mongoPassword) {
//       mongoURL += mongoUser + ':' + mongoPassword + '@';
//     }
//     // Provide UI label that excludes user id and pw
//     mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
//     mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
//   }
// }

//DATABASE 
module.exports = {
    initDb: function(callback) {

        console.log('initDb');  
        console.log('mongoURL', mongoURL); 
      
      if (mongoURL == null) return;

      var mongodb = require('mongodb');
      if (mongodb == null) return;

      mongodb.connect(mongoURL, function(err, conn) {
        if (err) {
          callback(err);
          console.log('initDb Error connecting');        
          return;
        }

        db = conn;

        console.log('Connected to MongoDB at: %s', mongoURL);
      });
  },
    
    getDB:function(){
        if (!db) {
            console.log('getDB db is NULL #############');        
          initDb(function(err){
              console.log('Error connecting to Mongo. Message:\n'+err);
          });
          return db;
        }
        else {
            return db;
        }
    }
};
