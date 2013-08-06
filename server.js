//-----------------------------------------
// 		Author: Vaibhav Aggarwal								   
//		Last updated: 08/01/2013		   
//----------------------------------------- 
 
 /*
 This serves as our server and will handle all incoming requests and will respond with data
 We will export all database functions from mysql.js
 */

// get express and start the server
var express = require('express');
var app = express();
app.use(express.bodyParser());
// get the mysql file and connect to the database
var db= require('./mysql');
db.connectToDb();
var crypto = require('./crypto');

app.get('/testConnection/',function(request,response){
	
response.send(db.log);

});


/*
Define all GET and POST routes here
*/

// Description : User logs in for the first time
// @param : phone number, name, timeZone
// @Return : Boolean addStatus, unique hash

app.post('/user',function(request,response){
	

// TODO: set the response headers
		var date = new Date();

console.log(request.body['unique_hash']);
		if(request.body['unique_hash'] && request.body['phone_number']){
			
			db.updateUserLocalTime(request.body['unique_hash'],request.body['phone_number'],request.body['local_time'],date.getTime());
			response.json({"status" : true});
			}
			
			
	if(!request.body['unique_hash']){
		var hash = crypto.generateHash(request.body['name'] + request.body['phone_number']+date.getTime());
		// pass name, number, and hash to the function
		var result  = db.addUser(hash,request.body['name'], request.body['phone_number'],request.body['local_time'],date.getTime());
		console.log(result);
		// result is not correct, take care of it async
		if(result){
				response.json({"uniquehash" :hash});
					}
		else{
		response.json("User already exists");
			}
	}

	response.end();
});

app.get('/user',function(request,response){

console.log(request.query['phone_number']);
console.log(request.query.phone_number);

// Call function to retrieve the friend ID's, then use those ID's to get all the information about those contacts
db.getContactInfo(request.query.unique_hash,request.query.phone_number);
response.json(request.query['unique_hash']);
response.end();
});


app.listen(process.env.PORT || 8080);
