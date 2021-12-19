const express = require("express");
const socket = require("socket.io");
const db = require("./db");
const socket_util = require("./Socket_utilities")


// App Setup
var app = express();
var server = app.listen(4552,function(){
    console.log('Listening to requests on port 4000' );
	//socket_util.startDatbase();
	
});

// Static Files
app.use(express.static('public'));

console.log(socket_util.searchInDB())
// Static Files
var io = socket(server);
var Clients = {};
var Providers = {};
var RequestedProviders = [];
var Requests = {};
var AcceptedRequests = []
var Ignore = 0;


io.on('connection',function(socket){ 

    var UserLat = socket.handshake.query.lat;
    var UserLong = socket.handshake.query.long;
    var UserType = socket.handshake.query.type;
    var UserId = socket.handshake.query.id;
	
    if(UserType == 'Clients'){
			      
            Clients[UserId] = { "UserId":UserId , "socket_id": socket.id, "lat": UserLat ,"long": UserLong};
			db.deleteData(db.collection,UserId,(err,n)=>{
							if(err){
								console.log(err);
							}else{
								db.saveData(db.collection, Clients[UserId],(err)=>{
							 if(err){
								 console.log(err);
							 }else{
								 console.log(UserType +' '+ UserId + ' has connected.');
							 }
						 });
							}
						});
          
    }
	else{
        Providers[UserId] = { "UserId": UserId ,"socket_id": socket.id
        , "lat": UserLat ,"long": UserLong 
        ,"range":socket.handshake.query.range};

               db.deleteData(db.collection2,UserId,(err,n)=>{
							if(err){
								console.log(err);
							}else{
								db.saveData(db.collection2, Providers[UserId],(err)=>{
							 if(err){
								 console.log(err);
							 }else{
								 console.log(UserType +' '+ UserId + ' has connected.');
								 db.getDate(db.collection3,(err,res)=>{
									 if(err){
										 console.log(err);
									 }else{
										
										 if(Object.size(res) > 0){
											 for (i=0;i<Object.size(res);i++) {
												 var newData = res[i];
												  newData.Trip_id = newData._id
												 db.getOnlyOneClient(db.collection,res[i].UserId,newData,(err,res)=>{
													
													 if(res){
														  var myidnow = res.socket_id;
													 console.log("Test /// / "+io.sockets.adapter.rooms[myidnow])
													 if(io.sockets.adapter.rooms[myidnow]){
														
                                                        emitOn(io,'request_range',newData,socket.id);
														
													 }else{
														 db.deleteData(db.collection3,newData._id,(err)=>{
															 console.log("Client " +newData.UserId+" Requests have been removed " );
															  db.deleteData(db.collection,newData.UserId,(err)=>{
															  });
														 });
														 
													 }
													 }else{
														 db.deleteData(db.collection3,newData._id,(err)=>{
															 console.log("Client " +newData.UserId+" Requests have been removed " );
															 
														 });
													 }
												 });
												
                                             }
										 }
									 }
								 });
							 }
							 
						 });
							} 
						 });
       		
    }
    socket.on('request_range', function(data){
		
	
        if(UserType == 'Clients'){
			data.request.rejectedProviders = [];
		    Requests['Request'+UserId] = data;
            db.saveData(db.collection3,data,(err,_id)=>{
			     data.Trip_id = _id;
				if(err){
					console.log(err);
				}else{
					db.getDate(db.collection2,(err,res)=>{
						if(err){
							console.log(err);
						}else{
							console.log('NEW REQUEST client '+ ' id = '+UserId );
							 if(Object.size(res) > 0){
						      for(i=0;i<Object.size(res);i++){
								  if(res[i].range){
								  if(getDistanceFromLatLonInMm(UserLat,UserLong,
								        res[i].lat,res[i].long)<res[i].range){
											if(res[i].socket_id){
											emitOn(io,'request_range',data,res[i].socket_id);
											
											}else{
												   
											   }
										}else{
										console.log("There is a request dose not match the range");
										}
								  }

							  }
					
							 }								  
						}
					});
				}
			});
            
        }
		else{
			
			
            if(data.Status == 'Reject'){
                console.log('Provider Rejected');
                // DeleteFromRequestedProvider(UserId);
                // Requests['Request'+data.request.id].request.rejectedProviders.push(UserId);
            }
             else if(data.Status =='Ignore'){
                console.log('Provider Ignored');
                /*if(Ignore < 1){
                    Ignore+=1;
                    DeleteFromRequestedProvider(UserId);
                   
                }*/
            }
             else if(data.Status == 'Accept'){
              
			   db.deleteData(db.collection3,data.UserId,(err,n)=>{
				   if(err){
					   console.log(err)
				   }else{
					   console.log(n);
					   if(n>0){
						    console.log('Provider '+UserId+' Accpeted id='); 
							db.getOnlyOneData(db.collection,data.request.id,(err,res)=>{
								if(err){
									console.log(err);
								}else{
									if(res){
									    emitOn(io,'confirm','true',socket.id);
									    emitOn(io,'found',data,res.socket_id);
									    db.saveData(db.collection4,data,(err)=>{
										  if(err){
											  
										  }else{
											  
										  }
								     	});
									}else{
										emitOn(io,'confirm','false',socket.id);
						                console.log('Provider '+UserId+' did not find request ');
									}
								}
							});
							
							
					   }else{
						   emitOn(io,'confirm','false',socket.id);
						   console.log('Provider '+UserId+' did not find request ');
					   }
				   }
			   });
			  
             }
        }
		
		
    });

    socket.on('disconnect', function() {
        //UserType == Clients?delete Clients[UserId]:delete Providers[UserId],DeleteFromRequestedProvider(UserId);
        //console.log(UserType +' '+ UserId + ' has left.');

        if(UserType=="Clients"){
            db.deleteData(db.collection,UserId,(err,n)=>{
				if(err)console.log(err);
				else console.log(UserType +' '+ UserId + ' has left.');
			});
        }else{
            db.deleteData(db.collection2,UserId,(err,n)=>{
				if(err)console.log(err);
				else console.log(UserType +' '+ UserId + ' has left.');
			});
        }
    });
	
	
	socket.on('arrived',function(id,TripId){
		db.getOnlyOneData(db.collection,id,(err,res)=>{
			if(err){
				console.log(err);
			}else{
				if(res){
				if(res.socket_id!=undefined){
					db.getTripData(TripId,(err,ress)=>{
						if(err&&!ress){
							console.log(err);
						}else{
							var mineresponseobject = {"response":ress.response}
							emitOn(io,'arrived',mineresponseobject,res.socket_id)
						}
					});
				
				
				}else{ emitOn(io,'Check_your_client','true',socket.id);}
				}else{ emitOn(io,'Check_your_client','true',socket.id);}
			}
		});
		db.updateTripStatus(TripId,'arrived',(err,res)=>{
					if(err){
						console.log(err);
					}else{
						
					}
				});
	});
	socket.on('pickedUp',function(id,TripId){
		
		db.getOnlyOneData(db.collection,id,(err,res)=>{
			if(err){
				console.log(err);
			}else{
				if(res){
				if(res.socket_id!=undefined){
			    
				db.getTripData(TripId,(err,ress)=>{
						if(err&&!ress){
							console.log(err);
						}else{
							var mineresponseobject = {"response":ress.response}
							emitOn(io,'pickedUp',mineresponseobject,res.socket_id)
						}
					});
				
				}else{ emitOn(io,'Check_your_client','true',socket.id);}
				}else{ emitOn(io,'Check_your_client','true',socket.id);}
			}
		});
		db.updateTripStatus(TripId,'pickedUp',(err,res)=>{
					if(err){
						console.log(err);
					}else{
						
					}
				});
		
	});
	socket.on('dropped',function(id,TripId,Invoice){
		
		db.getOnlyOneData(db.collection,id,(err,res)=>{
			if(err){
				console.log(err);
			}else{
				if(res){
				if(res.socket_id!=undefined){
					
				emitOn(io,'dropped',Invoice,res.socket_id);
				
				}else{ emitOn(io,'Check_your_client','true',socket.id);}
				}else{ emitOn(io,'Check_your_client','true',socket.id);}
			}
		});
		db.updateTripStatus(TripId,'dropped',(err,res)=>{
					if(err){
						console.log(err);
					}else{
						
					}
				});
		db.addInvoiceToTrip(TripId,Invoice,(err)=>{
			if(err){
					console.log(err);
					}else{
						
					}
				});
				
	});
	socket.on('Paid',function(id,TripId,Invoice){
		
		db.getOnlyOneData(db.collection,id,(err,res)=>{
			if(err){
				console.log(err);
			}else{
				if(res){
				  if(res.socket_id!=undefined){
				   db.getTripData(TripId,(err,ress)=>{
						if(err&&!ress){
							console.log(err);
						}else{
							var mineresponseobject = {"response":ress.response}
							emitOn(io,'Paid',mineresponseobject,res.socket_id)
						}
					});
				   }else{
					 emitOn(io,'Check_your_client','true',socket.id);
				   }
				}else{
					 emitOn(io,'Check_your_client','true',socket.id);
				}
			}
		});
		db.updateTripStatus(TripId,'Paid',(err,res)=>{
					
					if(!err){
						
						db.getTripData(TripId,(err,res)=>{
							
							if(err){
								console.log("2  /"+err);
							}else{
								db.saveData(db.collection5,res,(err)=>{
									
									if(err){
										console.log("3  /"+err);
									}else{
										db.deleteTripData(TripId,(err)=>{
											
											if(err){
										console.log("4  /"+err);
									          }else{
												  console.log("There is a Trip Completed successfully");
											  }
										});
									}
								});
							}
						});
					}else{
						console.log(err);
					}
				});
	});
	socket.on('delete_request',function(id){
		db.deleteData(db.collection3,id,(err,res)=>{
			if(err){
				console.log(err);
			}else{
				
			}
		});
		
	});
	
   
});

function DeleteFromRequestedProvider(Provider){
    if(RequestedProviders.indexOf(Provider) > -1 ){
        RequestedProviders.splice(RequestedProviders.indexOf(Provider), 1);
    }
}

function emitOn(io,room,data,to){
    if(to){
        io.to(to).emit(room,data);
    }else{
        io.emit(room,data);
    }
    console.log('Sent');
}


function getDistanceFromLatLonInMm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2) ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d*1000;
}
  
function deg2rad(deg) {
    return deg * (Math.PI/180)
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};