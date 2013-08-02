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
	database:'phonebook',

});

// Create connection to the database
var createConnection = function(){



connection.connect();

// To print out rows to console, just for our testing
/*connection.query('SELECT * FROM phonebook',function(err,rows,fields){

if(err) throw err;

console.log(rows);

});*/

}
var addNewUser = function(name,number){
connection.query('INSERT INTO phonebook (user_name,user_phone_number) VALUES ("'+name+'","' + number+'")',function(err,rows,fields){
if(err) throw err;

console.log(rows);

});
}

module.exports={

connectToDb : function(){
	createConnection();
	console.log("connected");
},
addUser : function(name,number){
	addNewUser(name,number);
}


};

