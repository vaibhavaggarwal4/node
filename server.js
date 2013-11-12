//-----------------------------------------
// 		Author: Vaibhav Aggarwal								   
//		Last updated: 10/29/2013		   
//----------------------------------------- 
 
 

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
	

	var date = new Date();
	if(request.body['unique_hash'] && request.body['phone_number']){
			
		db.updateUserLocalTime(request.body['unique_hash'],request.body['phone_number'],request.body['local_time'],parseInt(date.getTime()/1000),response);
			
		}
			
			
	if(!request.body['unique_hash']){
		var hash = crypto.generateHash(request.body['name'] + request.body['phone_number']+date.getTime());
		db.addUser(hash,request.body['name'], request.body['phone_number'],request.body['local_time'],parseInt(date.getTime()/1000),response);
	}

});

app.get('/user',function(request,response){
	var date = new Date();
	db.getContactInfo(request.query.unique_hash,request.query.phone_number,parseInt(date.getTime()/1000),response);

});

app.get('/user/self',function(request,response){
	var date = new Date();

	db.getSelfStatus(request.query.unique_hash,request.query.phone_number,parseInt(date.getTime()/1000),response);
});



app.post('/user/contacts',function(request,response){


// verify that all these parameters do exist before calling the database operation
db.updateContactInfo(request.body.unique_hash,request.body.phone_number,request.body.contacts,response);


});


app.post('/user/calendar',function(request,response){
	db.updateCalendarMeetings(request.body.unique_hash,request.body.phone_number,request.body.start_times,request.body.end_times,response);
});



app.post('/user/changeStatus',function(request,response){
	db.changeStatus(request.body['unique_hash'],request.body['phone_number'],request.body['target'],request.body['value'],response);
});
app.post('/user/calendarSync',function(request,response){
	db.calendarSync(request.body['unique_hash'],request.body['phone_number'],response);
});

app.post('/user/changeCallingHours',function(request,response){
	db.changeCallingHours(request.body['unique_hash'],request.body['phone_number'],request.body['start_time'],request.body['end_time'],response);
});
app.post('user/contacts/edit',function(request,response){
	db.editUserContacts(request.body.unique_hash,request.body_phone_number,request.body.contacts,response); 
});


app.listen(process.env.PORT || 8080);


/*
app.post('/user/self/available',function(request,response){

	db.updateAvailability(request.body['unique_hash'],request.body['phone_number'],request.body['availability'],response);
});
app.post('/user/self/viber',function(request,response){
		db.updateViber(request.body['unique_hash'],request.body['phone_number'],request.body['viber'],response);
});

app.post('/user/self/whatsapp',function(request,response){
		db.updateWhatsapp(request.body['unique_hash'],request.body['phone_number'],request.body['whatsapp'],response);
});
*/
/*
var interval = 0.1;
var timeSplice = 60*1000;
var jobRunInterval = interval * timeSplice;
setInterval(function(){
console.log(date.getTime());
},jobRunInterval);*/