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
var addNewUser = function(hash,name,number){
// check here if the user exists or not by querying the phone number first
connection.query('INSERT INTO users (authorizationHash,user_name,user_phone_number,is_active) VALUES ("'+hash+'","'+name+'","' + number+'","1")',function(err,rows,fields){
if(err) throw err;

console.log(rows);

});
}

module.exports={

connectToDb : function(){
	createConnection();
	
},
addUser : function(hash,name,number){
	addNewUser(hash,name,number);
}


};

