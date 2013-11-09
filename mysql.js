//-----------------------------------------
// 		Author: Vaibhav Aggarwal								   
//		Last updated: 11/09/2013		   
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
			response.writeHead(200, { 'Content-Type': 'application/json'});
			response.end(JSON.stringify({"status":"false","description":"User already exists"}));
		
		}
	
		else{
			connection.query('INSERT INTO users (authorization_hash,user_name,user_phone_number,user_local_time,is_active,last_synced) VALUES ("'+hash+'","'+name+'","' + number+'","' +time+'","1","'+syncTime+'")ON DUPLICATE KEY UPDATE user_phone_number=user_phone_number',function(err,rows,fields){
			if(err) throw err;
	
			callback(hash,response);
		
			});
		}
	
	});

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
			response.writeHead(200, { 'Content-Type': 'application/json'});
			response.end(JSON.stringify({"status":"false","description":"Incorrect Authorization"}));
		}
	});

}

var getContactInfo = function(hash,number,currentTime,response,callback){
	connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number ="' +number+'"',function(err,rows,fields){
		if(rows[0] && rows[0]['authorization_hash']==hash){
			connection.query('SELECT contact_id FROM contact_mapping WHERE user_id ='+rows[0]['user_id'],function(err,rows,fields){
				if(err) throw err;
				if(rows[0]){
					var list =[];
					for(row in rows){
					list.push(rows[row].contact_id);
				}
					var query = 'SELECT * FROM (SELECT u.user_id,u.user_name,u.user_phone_number,u.user_local_time,u.has_viber,u.has_whatsapp,u.is_active,u.last_synced,u.user_set_busy,u.calendar_sync,u.calling_hours_start_time,u.calling_hours_end_time';
					query+= ' FROM users u WHERE u.user_id IN ('+list+')) as u'; 
				  	query+= ' LEFT JOIN';
				  	query+= ' (SELECT c.user_id as cal_user_id, c.start_time,c.end_time FROM calendar_meetings c';
				  	query+= ' WHERE c.start_time < '+ currentTime +' AND c.end_time > '+ currentTime +' AND c.user_id IN ('+list+') HAVING min(c.start_time)) as c ON c.cal_user_id =u.user_id'; 
				    connection.query(query,function(err,rows,fields){
					if(err) throw err;
						callback(rows,response);
					});
				
				}
				else{
					response.writeHead(200, { 'Content-Type': 'application/json'});
					response.end(JSON.stringify({"status":"true","description":"No contacts using the app"}));
	
				}				
			});
		}
		else{
			response.writeHead(200, { 'Content-Type': 'application/json'});
		response.end(JSON.stringify({"status":"false","description":"Incorrect Authorization"}));
		}	

	});

}  

var updateContactInfo = function(hash,number,contacts,response,callback){
	var userID="";
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
			response.writeHead(200, { 'Content-Type': 'application/json'});
			response.end(JSON.stringify({"status":"false","description":"Incorrect Authorization"}));
		}


	});


}
var editUserContacts = function(hash,number,contacts,response,callback){
	var userID="";
	connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number="' + number +'"',function(err,rows,fields){
		if(err) throw err;
		if(rows[0]['authorization_hash']==hash){
		
			userID=rows[0].user_id;
			connection.query('SELECT user_id FROM users WHERE user_phone_number IN ('+contacts+')',function(err,rows,fields){
			if(err) throw err;

			connection.query(' DELETE FROM contact_mapping WHERE contact_id in (' + rows+ ') AND  user_id='+userID , function(err,rows,fields){
				if(err) throw err;
					callback(rows,response);

				});
			});
		}
		else{
				response.writeHead(200, { 'Content-Type': 'application/json'});
				response.end(JSON.stringify({"status":"false","description":"Incorrect Authorization"}));
			}
	});
}
var updateCalendarMeetings = function(hash,number,start_times,end_times,response,callback){      
	if(typeof start_times =='undefined'){
		response.writeHead(200, { 'Content-Type': 'application/json'});
		response.end(JSON.stringify({"status":"true","description":"No meetings to sync"}));
	}
	else{
		var userID="";

		connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number="' + number + '"',function(err,rows,fields){
			if(err) throw err;
			if(rows[0]['authorization_hash'] == hash){
				userID=rows[0].user_id;
				var insertValues="";
				for(var index in start_times){
					insertValues = insertValues+"("+userID+", "+ number +", "+start_times[index]+", "+end_times[index]+"),";
		
				}
				insertValues = insertValues.substring(0,insertValues.length-1);
				connection.query('INSERT IGNORE into calendar_meetings (user_id,user_phone_number,start_time,end_time) VALUES ' +insertValues, function(err,rows,fields){
					if(err) throw err;
						callback(rows,response);

					});
			
			}
			else{
					response.writeHead(200, { 'Content-Type': 'application/json'});
					response.end(JSON.stringify({"status":"false","description":"Incorrect Authorization"}));
			}	
		});
	}
}

var deletePastMeetings = function(callback){
	connection.query('DELETE from meetings WHERE past=1',function(err,rows,fields){
		if(err) throw err;
		callback(rows,"");
	
	});
}
var getSelfStatus = function(hash,number,currentTime,response,callback){
console.log(currentTime);
	var query = 'SELECT *  FROM';
	query+= ' (SELECT * FROM users u WHERE u.user_phone_number="'+number+'")  as u';
	query+= ' LEFT JOIN (SELECT * FROM calendar_meetings c WHERE c.user_phone_number ="'+number+'" AND c.`start_time`< ' + currentTime + ' AND c.`end_time`>'+ currentTime+') as c ON u.`user_id`=c.`user_id`';
	connection.query(query,function(err,rows,fields){
			if(err) throw err;
			if(rows[0] && rows[0]['authorization_hash']==hash){
				callback(rows,response);
			}
			else{
					response.writeHead(200, { 'Content-Type': 'application/json'});
					response.end(JSON.stringify({"status":"false","description":"Incorrect Authorization"}));

			}
	});

}



var changeStatus = function(hash,number,target,value,response,callback){
	var userID="";
	
	connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number="' + number + '"',function(err,rows,fields){
		if(err) throw err;
		if(rows[0]['authorization_hash']==hash){
			userID=rows[0].user_id;
			connection.query('UPDATE IGNORE users SET '+target+' ="'+value+'",calendar_sync="No" WHERE user_id="'+userID+'"',function(err,rows,fields){
				if(err) {
					throw err
					response.writeHead(200, { 'Content-Type': 'application/json'});
					response.end(JSON.stringify({"status":"false","description":"Could not change at this time"}));
				}
				else{
					callback(rows,response);
				}	
			
			});
		}
		else{
				response.writeHead(200, { 'Content-Type': 'application/json'});
				response.end(JSON.stringify({"status":"false","description":"Incorrect Authorization"}));
		}
	
	});

}

var calendarSync = function(hash,number,response,callback){

	var userID="";
		connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number="' + number + '"',function(err,rows,fields){
				if(err) throw err;
				if(rows[0]['authorization_hash']==hash){
					userID=rows[0].user_id;
					connection.query('UPDATE IGNORE users SET calendar_sync="Yes" WHERE user_id="'+userID+'"',function(err,rows,fields){
				if(err) {
					throw err
					response.writeHead(200, { 'Content-Type': 'application/json'});
					response.end(JSON.stringify({"status":"false","description":"Could not change at this time"}));
				}
				else{
					callback(rows,response);
				}	
			
			});

				}
				else{
					response.writeHead(200, { 'Content-Type': 'application/json'});
					response.end(JSON.stringify({"status":"false","description":"Incorrect Authorization"}));
				}
		
		});

}

module.exports={

connectToDb : function(){
	createConnection();
	
},
addUser : function(hash,name,number,time,syncTime,response){
	addNewUser(hash,name,number,time,syncTime,response,function(authorization_hash,response){
		response.writeHead(200,{'Content-Type':'application/json'});
		var res = {"status":"true","unique_hash":authorization_hash};
		response.end(JSON.stringify(res));
	 });
	
},
updateUserLocalTime : function(hash,number,time,syncTime,response){
	updateUserLocalTime(hash,number,time,syncTime,response,function(rows,response){
	
			response.writeHead(200,{'Content-Type':'application/json'});
			response.end(JSON.stringify({"status":"true"}));
	});
},

getContactInfo : function(hash,number,currentTime,response){
	getContactInfo(hash,number,currentTime,response,function(rows,response){
		response.writeHead(200, { 'Content-Type': 'application/json'});
		var res = {"status":"true","contacts":rows,"currentTime":currentTime};
    	response.end(JSON.stringify(res));
		
	});

},
updateContactInfo : function(hash,number,contacts,response){
	updateContactInfo(hash,number,contacts,response,function(rows,response){
		response.writeHead(200,{'Content-Type':'application/json'});
		response.end(JSON.stringify({"status":"true"}));
	});
},

updateCalendarMeetings : function(hash,number,start_times,end_times,response){

	updateCalendarMeetings(hash,number,start_times,end_times,response,function(rows,response){
		response.writeHead(200,{'Content-Type':'application/json'});
		response.end(JSON.stringify({"status":"true"}));
	});
	
},

deletePastMeetings : function(){
	deletePastMeetings(function(rows,response){
	console.log(rows);
	});
},
editUserContacts : function(hash,number,contacts,response){
	editUserContacts(hash,number,contacts,response,function(rows,response){
		response.writeHead(200,{'Content-Type':'application/json'});
		response.end(JSON.stringify({"status":"true"}));
	});
},
getSelfStatus : function(hash,number,currentTime,response){
	getSelfStatus(hash,number,currentTime,response,function(rows,response){
		response.writeHead(200, { 'Content-Type': 'application/json'});
		var res = {"status":"true","details":rows,"currentTime":currentTime};
    	response.end(JSON.stringify(res));
		
	
	});
},

changeStatus : function(hash,number,target,value,response){
	changeStatus(hash,number,target,value,response,function(rows,response){
		response.writeHead(200,{'Content-Type':'application/json'});
		response.end(JSON.stringify({"status":"true"}));
	});


},
calendarSync : function(hash,number,response){
	calendarSync(hash,number,response,function(rows,response){
		response.writeHead(200,{'Content-Type':'application/json'});
		response.end(JSON.stringify({"status":"true"}));
	});


}


};

/*CREATE TEMPORARY TABLE contacts as (SELECT users.user_id,users.user_name,users.user_phone_number,users.user_local_time,users.last_synced,users.user_set_busy FROM users where users.user_id IN (1,24,25)); 

CREATE TEMPORARY TABLE temp as (SELECT * FROM meetings WHERE user_id in (24,25) AND start_time>755 AND start_time<855);

CREATE TEMPORARY TABLE temp1 as (SELECT users.user_id,users.user_phone_number,temp.start_time,temp.end_time FROM users LEFT JOIN temp ON users.user_id= temp.user_id WHERE users.user_id in (24,25));

SELECT contacts.`user_id`,contacts.`user_phone_number`,contacts.`user_name`,contacts.`user_local_time`,contacts.`last_synced`,contacts.`user_set_busy`,temp1.`start_time`,temp1.`end_time` FROM contacts LEFT JOIN temp1 ON contacts.user_id = temp1.user_id;

DROP TABLE temp1

*/

// Should I combine all these functions into 1, We can, but should we?

/*
var updateAvailability = function(hash,number,availability,response,callback){
	var userID="";
	connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number="' + number + '"',function(err,rows,fields){
		if(err) throw err;
		if(rows[0]['authorization_hash']==hash){
			userID=rows[0].user_id;
			connection.query('UPDATE IGNORE users SET user_set_busy="'+availability+'" WHERE user_id="'+userID+'"',function(err,rows,fields){
				if(err) {
				throw err
				response.writeHead(200, { 'Content-Type': 'application/json'});
				response.end(JSON.stringify({"status":"false","description":"Could not change at this time"}));
				}
				else{
					callback(rows,response);
				}	
			
			});
		}
		else{
				response.writeHead(200, { 'Content-Type': 'application/json'});
				response.end(JSON.stringify({"status":"false","description":"Incorrect Authorization"}));
		}
	
	});

}

var updateViber = function(hash,number,viber,response,callback){
	var userID="";
	connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number="' + number + '"',function(err,rows,fields){
		if(err) throw err;
		if(rows[0]['authorization_hash']==hash){
			userID=rows[0].user_id;
			connection.query('UPDATE IGNORE users SET has_viber="'+viber+'" WHERE user_id="'+userID+'"',function(err,rows,fields){
				if(err) {
				throw err
				response.writeHead(200, { 'Content-Type': 'application/json'});
				response.end(JSON.stringify({"status":"false","description":"Could not change at this time"}));
				}
				else{
					callback(rows,response);
				}	
			
			});
		}
		else{
				response.writeHead(200, { 'Content-Type': 'application/json'});
				response.end(JSON.stringify({"status":"false","description":"Incorrect Authorization"}));
		}
	
	});

}

var updateWhatsapp = function(hash,number,whatsapp,response,callback){
	var userID="";
	connection.query('SELECT authorization_hash,user_id FROM users WHERE user_phone_number="' + number + '"',function(err,rows,fields){
		if(err) throw err;
		if(rows[0]['authorization_hash']==hash){
			userID=rows[0].user_id;
			connection.query('UPDATE IGNORE users SET has_whatsapp="'+whatsapp+'" WHERE user_id="'+userID+'"',function(err,rows,fields){
				if(err) {
				throw err
				response.writeHead(200, { 'Content-Type': 'application/json'});
				response.end(JSON.stringify({"status":"false","description":"Could not change at this time"}));
				}
				else{
					callback(rows,response);
				}	
			
			});
		}
		else{
				response.writeHead(200, { 'Content-Type': 'application/json'});
				response.end(JSON.stringify({"status":"false","description":"Incorrect Authorization"}));
		}
	
	});

}*/
/*
updateAvailability : function(hash,number,availability,response){
	updateAvailability(hash,number,availability,response,function(rows,response){
		response.writeHead(200,{'Content-Type':'application/json'});
		response.end(JSON.stringify({"status":"true"}));
	});


},
updateViber : function(hash,number,viber,response){
	updateViber(hash,number,viber,response,function(rows,response){
		response.writeHead(200,{'Content-Type':'application/json'});
		response.end(JSON.stringify({"status":"true"}));
	});


},
updateWhatsapp : function(hash,number,whatsapp,response){
	updateWhatsapp(hash,number,whatsapp,response,function(rows,response){
		response.writeHead(200,{'Content-Type':'application/json'});
		response.end(JSON.stringify({"status":"true"}));
	});


},
*/

