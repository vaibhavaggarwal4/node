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
response.set({"content-type":"text/json"});

var testObj = {"connected" : "True"};
response.json(200,testObj);

response.end();
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
	if(request.body['unique_hash'] && request.body['phone_number']){
			
		db.updateUserLocalTime(request.body['unique_hash'],request.body['phone_number'],request.body['local_time'],date.getTime(),response);
			
		}
			
			
	if(!request.body['unique_hash']){
		var hash = crypto.generateHash(request.body['name'] + request.body['phone_number']+date.getTime());
		db.addUser(hash,request.body['name'], request.body['phone_number'],request.body['local_time'],date.getTime(),response);
	}

	//response.end();
});

app.get('/user',function(request,response){
db.getContactInfo(request.query.unique_hash,request.query.phone_number,response);

});


app.post('/user/contacts',function(request,response){


// verify that all these parameters do exist before calling the database operation
db.updateContactInfo(request.body.unique_hash,request.body.phone_number,request.body.contacts,response);


});


app.listen(process.env.PORT || 8080);
