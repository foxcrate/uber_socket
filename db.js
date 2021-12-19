//const MongoClient = require("mongodb").MongoClient;
//const ObjectID = require('mongodb').ObjectID;
//const dbname = "socket_db";
//const url = "mongodb://localhost:27017"

const mongoOptions = {useNewUrlParser : true};

const collection = "Clients";
const collection2 = "Providers";
const collection3 = "Requests";
const collection4 = "ActiveTrips";
const collection5 = "FinishedTrips";

function saveData(coll,data,cb){
    MongoClient.connect(url,mongoOptions,(err,client)=>{
        if(err){
				cb(err,0);
          console.log('database erorr at '+collection);
         }else{
         client.db(dbname).collection(coll).insertOne( data, function(err, res) {
             client.close();
			 cb(0,data._id);
              });
            
         }
       });
}

function deleteData(coll,ID,cb){
    MongoClient.connect(url,mongoOptions,(err,client)=>{
        var myquery = { "UserId": ID };
        if(err){
			cb(err,0);
         }else{
         client.db(dbname).collection(coll).deleteMany( myquery, function(err, res) {
            
			 client.close();
			 cb(0,res.result.n);
			 
              });
            
         }
       });
}
function deleteTripData(ID,cb){
    MongoClient.connect(url,mongoOptions,(err,client)=>{
        var myquery = { "_id": ID };
        if(err){
			cb(err,0);
         }else{
         client.db(dbname).collection(collection4).deleteMany( myquery, function(err, res) {
            
			 client.close();
			 cb(0,res.result.n);
			 
              });
            
         }
       });
}
function getDate(coll,cb){
	 MongoClient.connect(url,mongoOptions,(err,client)=>{
        
        if(err){
          console.log('database erorr at '+data);
         }else{
         client.db(dbname).collection(coll).find({}).toArray(function(err, result) {
              
			 if(err){
				 cb(err,false);
			 }else{
				 cb(false,result)
				 client.close();
			 //console.log(result)
			
			 }
              });
            
         }
       });
}
function getOnlyOneData(coll,ID,cb){
	 MongoClient.connect(url,mongoOptions,(err,client)=>{
        var myquery = { "UserId": ID };
        if(err){
          console.log('database erorr at '+data);
		   cb(err,false);
         }else{
         client.db(dbname).collection(coll).findOne(myquery,(err, result)=>{
              
			 if(err){
				 cb(err,false);
			 }else{
				 cb(false,result);
				 client.close();
			 //console.log(result)
			
			 }
              });
            
         }
       });
}
function getOnlyOneClient(coll,ID,data,cb){
	 MongoClient.connect(url,mongoOptions,(err,client)=>{
        var myquery = { "UserId": ID };
        if(err){
          console.log('database erorr at '+data);
		   cb(err,false,data);
         }else{
         client.db(dbname).collection(coll).findOne(myquery,(err, result)=>{
              
			 if(err){
				 cb(err,false,data);
			 }else{
				 cb(false,result,data)
				 client.close();
			 //console.log(result)
			
			 }
              });
            
         }
       });
}
function getTripData(ID,cb){
    console.log('database loggginn at mongo');

    MongoClient.connect(url,mongoOptions,(err,client)=>{
        var myquery = { "_id": ID };
        if(err){
          console.log('database erorr at '+data);
         }else{
         client.db(dbname).collection(collection4).findOne(myquery,(err, result)=>{
              
			 if(err){
				 cb(err,false);
			 }else{
				 cb(false,result)
				 client.close();
			 
			
			 }
              });
            
         }
       });
}
function updateData(){}
function updateTripStatus(id,status,cb){
	 MongoClient.connect(url,mongoOptions,(err,client)=>{
       if (err) {
		    console.log('database erorr at '+collection4);
	   }else{
       var myquery = { _id: id };
       var newvalues = { $set: {"Status":status } };
       client.db(dbname).collection(collection4).updateOne(myquery, newvalues, function(err, res) {
           if (err) {
		       cb(err);
	       }else{
	        	cb(false);
	          client.close();
			 
	       }
   
       });
	    }
     });
}
function addInvoiceToTrip(id,invoice,cb){
	 MongoClient.connect(url,mongoOptions,(err,client)=>{
		 if(err){
			 console.log('database erorr at '+collection4);
		 }else{
			 var myquery = { _id: id };
			 var newvalues = { $set: {"Invoice":invoice } };
			 client.db(dbname).collection(collection4).updateOne(myquery, newvalues, function(err, res) {
				 if(err){
					 cb(err);
				 }else{
				 cb(false);
				 client.close();
				 }
			 });
		 }
	 });
}



module.exports.saveData = saveData;
module.exports.getDate = getDate;
module.exports.getOnlyOneData = getOnlyOneData;
module.exports.getOnlyOneClient = getOnlyOneClient;
module.exports.getTripData = getTripData;
module.exports.deleteData = deleteData;
module.exports.deleteTripData = deleteTripData;
module.exports.updateData = updateData;
module.exports.updateTripStatus = updateTripStatus;
module.exports.addInvoiceToTrip = addInvoiceToTrip;
module.exports.collection = collection;
module.exports.collection2 = collection2;
module.exports.collection3 = collection3;
module.exports.collection4 = collection4;
module.exports.collection5 = collection5;
