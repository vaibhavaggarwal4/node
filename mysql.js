//-----------------------------------------
// 		Author: Vaibhav Aggarwal								   
//		Last updated: 08/01/2013		   
//----------------------------------------- 
 
 /*
 Contains various functions to handle all database operations.
 They are exported to server.js for there use
 Functions such as Connect to DB, Add user contacts, fetch user contacts, update times and the likes
 Node is asynchronous and runs on just one thread, so hopefully we should not have those issues!
 */
 
 
 var mysql = require('mysql');
 var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'makeitbig',
	database:'ContactBook',

});

// Create connection to the database
var createConnection = function(){

connection.connect(function(err){

if(err) throw err;

console.log("connected");

});

// To print out rows to console, just for our testing
/*connection.query('SELECT * FROM phonebook',function(err,rows,fields){

if(err) throw err;

console.log(rows);

});*/

}
var addNewUser = function(hash,name,number,time,syncTime){

// check here if the user exists or not by querying the phone number first
connection.query('SELECT user_id FROM users WHERE user_phone_number ="' +number+'"',function(err,rows,fields){

	if(rows[0]){
		 return false;
	}
	else{
		connection.query('INSERT INTO users (authorization_hash,user_name,user_phone_number,user_local_time,is_active,last_synced) VALUES ("'+hash+'","'+name+'","' + number+'","' +time+'","1","'+syncTime+'")',function(err,rows,fields){
		if(err) throw err;

		return true;	
		});
	}
});

	return true;

}


var updateUserLocalTime = function(hash,number,time,syncTime){
// First make sure that the hash matches
	connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number="'+number+'"',function(err,rows,fields){
	console.log(rows);
	if(rows[0] && rows[0]['authorization_hash']==hash){
				connection.query('UPDATE users SET user_local_time = "' +time+'", last_synced = "'+ syncTime +'" WHERE user_id ="'+rows[0]['user_id']+'"',function(err,rows,fields){
				if(err) throw err;

		
						});
				}
	
	});

}


var getContactInfo = function(hash,number){
// Verify hash for the phone_number, retrieve the id and use that to get all the contact lists info
connection.query('SELECT contact_id FROM contact_mapping WHERE user_id =(SELECT user_id FROM users WHERE user_phone_number="' + number +'")',function(err,rows,fields){
if(err) throw err;
var list =[];
for(row in rows){
list.push(rows[row].contact_id);
}
console.log(list);
if(rows[0]){
connection.query('SELECT * FROM users WHERE user_id IN('+list+')',function(err,rows,fields){
if(err) throw err;
console.log(rows);

});}
});

}  

// remove extraneous lines, check hash, decide what needs to be asynchronous and what not, and return to server
var updateContactInfo = function(hash,number,contacts){
var userID="";
// we again want to verify the hash first
connection.query('SELECT user_id FROM users WHERE user_phone_number="' + number +'"',function(err,rows,fields){
if(err) throw err;
userID=rows[0].user_id;
connection.query('SELECT user_id FROM users WHERE user_phone_number IN ('+contacts+')',function(err,rows,fields){
if(err) throw err;
var insertValues="";
for(row in rows)
{
insertValues=insertValues+"("+userID+","+rows[row].user_id+"),";
}
insertValues = insertValues.substring(0,insertValues.length-1);

connection.query('INSERT IGNORE into contact_mapping (user_id,contact_id) VALUES ' +insertValues, function(err,rows,fields){
if(err) throw err;

console.log(rows);
});
});

});



}
       

module.exports={

connectToDb : function(){
	createConnection();
	
},
addUser : function(hash,name,number,time,syncTime){
	return addNewUser(hash,name,number,time,syncTime);
	
	
},
updateUserLocalTime : function(hash,number,time,syncTime){
	updateUserLocalTime(hash,number,time,syncTime);
},

getContactInfo : function(hash,number){
	getContactInfo(hash,number);

},
updateContactInfo : function(hash,number,contacts){
	updateContactInfo(hash,number,contacts);
}

};

