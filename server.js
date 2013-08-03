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


app.post('/user',function(request,response){
	var hash = crypto.generateHash(request.body['name'] + request.body['phone_number']);
	// pass name, number, and hash to the function
	db.addUser(hash,request.body['name'], request.body['phone_number']);

	
});

/*
Define all GET and POST routes here
*/

// Description : User logs in for the first time
// @param : phone number, name, timeZone
// @Return : Boolean addStatus, unique hash



app.listen(process.env.PORT || 8080);
