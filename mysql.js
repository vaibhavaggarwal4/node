//-----------------------------------------
// 		Author: Vaibhav Aggarwal								   
//		Last updated: 09/01/2013		   
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
var addNewUser = function(hash,name,number,time,syncTime,response,callback){

// check here if the user exists or not by querying the phone number first
connection.query('SELECT user_id FROM users WHERE user_phone_number ="' +number+'"',function(err,rows,fields){

	if(rows[0]){
		response.json(200,{"status":"false","description":"User already exists"});
		response.end();
	}
	
	else{connection.query('INSERT INTO users (authorization_hash,user_name,user_phone_number,user_local_time,is_active,last_synced) VALUES ("'+hash+'","'+name+'","' + number+'","' +time+'","1","'+syncTime+'")ON DUPLICATE KEY UPDATE user_phone_number=user_phone_number',function(err,rows,fields){
	if(err) throw err;
	
	callback(hash,response);
		});
		}
	
});
// Is there really a race condition above?
/*connection.query('INSERT INTO users (authorization_hash,user_name,user_phone_number,user_local_time,is_active,last_synced) VALUES ("'+hash+'","'+name+'","' + number+'","' +time+'","1","'+syncTime+'") ON DUPLICATE KEY UPDATE user_phone_number=user_phone_number',function(err,rows,fields){
response.json(rows);
});*/
}


var updateUserLocalTime = function(hash,number,time,syncTime,response,callback){
// First make sure that the hash matches
	connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number="'+number+'"',function(err,rows,fields){
	if(rows[0] && rows[0]['authorization_hash']==hash){
		connection.query('UPDATE users SET user_local_time = "' +time+'", last_synced = "'+ syncTime +'" WHERE user_id ="'+rows[0]['user_id']+'"',function(err,rows,fields){
			if(err) throw err;

				callback(rows,response);
				});
		}
	else{
		// maybe we just need to send false and log rest of the information
		response.write("false");
		response.write("Incorrect Authorization");
		response.end();
	}
	});

}


var getContactInfo = function(hash,number,response,callback){
	connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number ="' +number+'"',function(err,rows,fields){
		if(rows[0] && rows[0]['authorization_hash']==hash){
			connection.query('SELECT contact_id FROM contact_mapping WHERE user_id ='+rows[0]['user_id'],function(err,rows,fields){
				if(err) throw err;
				if(rows[0]){
					var list =[];
					for(row in rows){
					list.push(rows[row].contact_id);
					}
					connection.query('SELECT * FROM users WHERE user_id IN('+list+')',function(err,rows,fields){
					if(err) throw err;
					callback(rows,response);
					});
				
				}
				else{
					response.json(rows);
					response.end();
				}				
			});
		}
		else{
			response.write("false\n");
			response.write("Incorrect Authorization");
			response.end();
		}	

	});

}  




// remove extraneous lines, check hash, decide what needs to be asynchronous and what not, and return to server
var updateContactInfo = function(hash,number,contacts,response,callback){
var userID="";
// we again want to verify the hash first
connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number="' + number +'"',function(err,rows,fields){
	if(err) throw err;
	if(rows[0]['authorization_hash']==hash){
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
				callback(rows,response);

				});
		});
	}
	else{
		response.write("false\n");
		response.write("Incorrect Authorization");
		response.end();
	}


	});


}

var updateCalendarInfo = function(hash,number,calendar,response,callback){      
var userID="";
connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number="' + number + '"',function(err,rows,fields){
	if(err) throw err;
	if(rows[0]['authorization_hash'] == hash){
		userID=rows[0].user_id;
		var insertValues="";
		for(var index in calendar){
			insertValues = insertValues+"("+userID+","+calendar[index].start_time+","+calendar[index].end_time+"),";
		
		}
		insertValues = insertValues.substring(0,insertValues.length-1);
		
			connection.query('INSERT IGNORE into meetings (user_id,start_time,end_time) VALUES ' +insertValues, function(err,rows,fields){
				if(err) throw err;
				callback(rows,response);

				});
	}	
});
}

deletePastMeetings = function(callback){
	connection.query('DELETE from meetings WHERE past=1',function(err,rows,fields){
		if(err) throw err;
		callback(rows,"");
	
	});
}


module.exports={

connectToDb : function(){
	createConnection();
	
},
addUser : function(hash,name,number,time,syncTime,response){
	addNewUser(hash,name,number,time,syncTime,response,function(authorization_hash,response){
		response.json(200,{'unique_hash' : authorization_hash});
		response.end();
	 });
	
},
updateUserLocalTime : function(hash,number,time,syncTime,response){
	updateUserLocalTime(hash,number,time,syncTime,response,function(rows,response){
	// Do we want to do something with the rows or just say true;
	//response.json(200,rows);
	response.json(200,true);
	response.end();
	});
},

getContactInfo : function(hash,number,response){
	getContactInfo(hash,number,response,function(rows,response){
		response.json(200,rows);
		response.end();
	});

},
updateContactInfo : function(hash,number,contacts,response){
	updateContactInfo(hash,number,contacts,response,function(rows,response){
	response.json(200,{"Status":"True"});
	response.json(rows);
	response.end();
	});
},

updateCalendarInfo : function(hash,number,calendar,response){
	updateCalendarInfo(hash,number,calendar,response,function(rows,response){
	console.log(rows);
		//response -> true
		//response.end
	});
	
},

deletePastMeetings : function(){
	deletePastMeetings(function(rows,response){
	console.log(rows);
	});
}

};

