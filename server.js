//-----------------------------------------
// 		Author: Vaibhav Aggarwal								   
//		Last updated: 09/26/2013		   
//----------------------------------------- 
 
 /*
 This serves as our server and will handle all incoming requests and will respond with data
 We will export all database functions from mysql.js
 */

// get express and start the server
var express = require('express');
var schedule=require('node-schedule');
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
		db.addUser(hash,request.body['name'], request.body['phone_number'],request.body['local_time'],parseInt(date.getTime()/1000),response);
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


app.post('user/calendar',function(request,response){

db.updateCalendarMeetings(request.body.unique_hash,request.body.phone_number,request.body.calendar,response);
});

/*var response = "";
var calendarItems = [{"start_time":0800,"end_time":0900},{"start_time":1030,"end_time":1130},{"start_time":1330,"end_time":1400},{"start_time":1600,"end_time":1700}];
db.updateCalendarInfo("f8b02e92e32f62d878e3289e04044057","7019361484",calendarItems,response);
db.deletePastMeetings();*/

/*var interval = 0.1;
var timeSplice = 60*1000;
var jobRunInterval = interval * timeSplice;

setInterval(function(){
console.log("Hey there");
},jobRunInterval);*/

app.post('user/contacts/edit',function(request,response){
	db.editUserContacts(request.body.unique_hash,request.body_phone_number,request.body.contacts,response); 
});


app.listen(process.env.PORT || 8080);
