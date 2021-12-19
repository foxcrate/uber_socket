{
    var express = require("express"); //// run the server on the express 
    var socket = require("socket.io");   ///// require socket.io 
    var mysql = require("mysql");////connect to my sqli 
    var request = require('request');
    var fs = require('fs');
    var port = process.env.port || 3000
    var app = express()
    var server = app.listen(port, () => console.log(`the app is listining to port  ${port}`))
    // Static Files
    app.use(express.static('public'));   ///// move to puplic folder (chat app) 
    // global variable
    var io = socket(server);  ///// include the server inside the socket 
    var Clients = {};
    var Providers = {};
    var RequestedProviders = [];
    var Requests = {};
    var ProvidersTripTune = {};
    var AcceptedRequests = [];
    var TripsProviderAfterWating = [];
    // var requestClient = [];
    var requestScduleTrip = '';
    var Providerss = {};
    var Clientss = {};
    var requestScduleTrip = '';
    //var Providerss = {};
    var Clientss = {};
    var providers_sockets=[];
    var clients_sockets=[];
}

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    port: 3307,
    password: "",
    database: "ailbazco_db"
});

connection.connect();

 connection.query("SELECT id,user_id,provider_id FROM user_requests WHERE status != 'COMPLETED' AND  status != 'CANCELLED'" ,function (error, results, fields){
 console.log("------------------------- ruqest not completed -----------------------------\n");
    console.log(results);
    console.log("-------------------------- end -------------------\n");
});
connection.end(); 

io.on('connection', function (socket) {    ////// connection add eventlistner 

    

    // try{
    //     var x= 8/0;
    //     console.log(x);
    //     throw new Error('Error Occurred'); 
    // }catch(err1){
    //     console.log("--------------------");

    //     err1.where="io.connetcion";
    //     err1.date=new Date().toLocaleString();
    //     err1.body=err1.stack;
    //     err1.data="ALo";

    //     fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
    //         if(err) {
    //             return console.log(err);
    //         }

    //         fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
    //             if(err) {
    //                 return console.log(err);
    //             }
    //         });

    //         console.log("The file was saved!");
    //     }); 
    // }

    //Intro Operations

    try{
        var UserLat = socket.handshake.query.lat;
        var UserLong = socket.handshake.query.long;
        var UserType = socket.handshake.query.type;
        var UserId = socket.handshake.query.id;
        //var UserMac= socket.handshake.query.mac;
        var UserService = socket.handshake.query.service;

        //console.log('Mac:   ',socket.handshake.query.mac);

        if (UserType == 'Clients') {
            console.log('Type is Clients -->', socket.id);
            Clients[UserId] = { "socket_id": socket.id, "lat": UserLat, "long": UserLong, Clients_id: UserId };
            console.log('users', Clients);
            Clientss[UserId] = socket;

            clients_sockets.push( {id: socket.handshake.query.id , socket: socket.id } );

            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            });

            connection.connect();
            connection.query("SELECT user_requests.*, users.* ,user_requests.id as tripid    FROM user_requests INNER JOIN users ON user_requests.user_id=users.id where  user_id = ? and schedule_at IS NOT NULL ORDER BY user_requests.id DESC LIMIT 1", [UserId], function (error, results, fields) {
                if (!error) {
                    if (results.length == 0) {
                        console.log("result get data from data base  is null");
                        setvaluedatescdule(null)
                    } else {
                        console.log("result get data from data base ", results[0]);
                        setvaluedatescdule(results[0].schedule_at.toLocaleString(), results[0].tripid, results[0].s_address_ar, results[0].s_address_en, results[0].d_address_ar, results[0].d_address_en, results[0].mobile, results[0].email, results[0].id);
                    }
                } else {
                    console.log("error get data from data base", error);
                    return error;
                };
            });
            connection.end();
        } else {
            console.log('Type is provider -->', socket.id);
            Providers[UserId] = {
                "socket_id": socket.id, "lat": UserLat, "long": UserLong, "provider_id": UserId,
                "range": socket.handshake.query.range,
                "provider_service": UserService
            };
            
            Providerss[UserId] = socket;

            providers_sockets.push( {id: socket.handshake.query.id , socket: socket.id } );


            console.log("providers are ", Providers);
            console.log("------------------");

            if (Object.size(Requests) > 0) {

                for (var Request in Requests) {

                    if (RequestedProviders.indexOf(UserId) <= -1 && Requests[Request].request.rejectedProviders.indexOf(UserId) <= -1 && Requests[Request].request.rejectedProviders.includes(parseInt(UserId)) == false) {
                        var requestLatitude = Requests[Request].request.s_latitude,
                            requestLongitude = Requests[Request].request.s_longitude,
                            providerLatitude = Providers[UserId].lat,
                            providerLongitude = Providers[UserId].long,
                            provider_service = Providers[UserId].provider_service,
                            providerRange = Providers[UserId].range;

                        if (getDistanceFromLatLonIMm(providerLatitude, providerLongitude, requestLatitude, requestLongitude) <= providerRange && Requests[Request].request.service_type == provider_service) {
                            //  console.log("send request to this provider this provider new connect",Requests[Request]);
                            emitOn(io, 'request_range', Requests[Request], socket.id);
                            RequestedProviders.push(UserId);

                            console.log("ProviderTripTone");
                            console.log(ProvidersTripTune);
                            console.log("-------------");

                            console.log("Requests");
                            console.log(Requests);
                            console.log("-------------");

                            console.log("---------IO Connection-------------");
                            console.log("userID "+UserId);
                            
                            try{
                                console.log({Requests});

                                console.log({ProvidersTripTune})

                                console.log(ProvidersTripTune[Requests[Request].request.Trip_id.toString()]);
                            }catch(err){
                                console.log(err);
                            }
                            console.log("---------------------------");

                            ProvidersTripTune[Requests[Request].request.Trip_id.toString()].push(UserId);

                            console.log("ProvidersTripTune",ProvidersTripTune);
                            // return;
                        }
                        else {
                            console.log("provider not match distance or service");
                        }
                    }
                    else {
                        console.log("provider not match RequestedProviders or rejected ");
                        console.log("Aloo From IO Connection");
                        console.log(RequestedProviders);
                    }
                }

            }

            
        }
        console.log("providers sockets",providers_sockets);
        console.log("clients sockets",clients_sockets);
        
    }catch(err1){
        err1.where="io.connetcion";
        err1.date=new Date().toLocaleString();
        err1.body=err1.stack;

        fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
            if(err) {
                return console.log(err);
            }

            fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                if(err) {
                    return console.log(err);
                }
            });

            fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                if(err) {
                    return console.log(err);
                }
            });

            console.log("-----------------------The file was saved-------------------");
        }); 
    }

    socket.on('update_provider_location', function(data){
    
        try{
            //console.log(data);
            console.log("----------update_provider_location Event------------");
            console.log(data);

            Providers[data.providerID] = {
                "socket_id": socket.id, "lat": data.latitude.toString() , "long": data.longitude.toString() , "provider_id": data.providerID,
                "range": socket.handshake.query.range,
                "provider_service": UserService
            };
            Providerss[data.providerID] = socket;
            
            console.log("----Loacation Changed--------");

            console.log("---Normal Providers Array--- : ");
            console.log("providers are ", Providers);
            console.log("------------------");

            //////////////////////////
            if (Object.size(Requests) > 0) {

                for (var Request in Requests) {

                    if (RequestedProviders.indexOf(data.providerID) <= -1 && Requests[Request].request.rejectedProviders.indexOf(data.providerID) <= -1 && Requests[Request].request.rejectedProviders.includes(parseInt(data.providerID)) == false) {
                        var requestLatitude = Requests[Request].request.s_latitude,
                            requestLongitude = Requests[Request].request.s_longitude,
                            providerLatitude = Providers[data.providerID].lat,
                            providerLongitude = Providers[data.providerID].long,
                            provider_service = Providers[data.providerID].provider_service,
                            providerRange = Providers[data.providerID].range;

                        if (getDistanceFromLatLonIMm(providerLatitude, providerLongitude, requestLatitude, requestLongitude) <= providerRange && Requests[Request].request.service_type == provider_service) {
                            //  console.log("send request to this provider this provider new connect",Requests[Request]);
                            emitOn(io, 'request_range', Requests[Request], socket.id);
                            RequestedProviders.push(data.providerID);
                            ProvidersTripTune[Requests[Request].request.Trip_id.toString()].push(data.providerID);
                            console.log("ProvidersTripTune",ProvidersTripTune);
                            // return;
                        }
                        else {
                            console.log("provider not match distance or service");
                        }
                    }
                    else {
                        console.log("provider not match RequestedProviders or rejected ");
                        console.log("Aloo From Update Location");
                    }
                }

            }
        }catch(err1){
        err1.where="Event: update_provider_location";
        err1.date=new Date().toLocaleString();
        err1.body=err1.stack;
        err1.data=data;

        fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
            if(err) {
                return console.log(err);
            }

            fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                if(err) {
                    return console.log(err);
                }
            });

            fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                if(err) {
                    return console.log(err);
                }
            });

            console.log("-------------------------------The file was saved---------------------------");
        }); 
    }

    });

    socket.on('request_range_clients', function (data) {
        try{
            console.log("request_range_clients event user",data);
            // setValues(data.request);
            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            });

            connection.connect();

            //////////////////////////////////////////////////////////////////////////////////////////
            // connection.query("SELECT * FROM user_requests WHERE status != 'COMPLETED' AND  status != 'CANCELLED' AND user_id =?", [ data.request.id ],function (error, results, fields){
            //     console.log(results.length);          
            //     if(results.length = 0 ){
            //         if (!error) {
            //             console.log("insert request in data base  and this is trib id", results.insertId);
            //             console.log(results);
            //             console.log("------------------------- ruqest not completed -----------------------------\n");
            //                                 return results;
                                            
        
            //         } else {
            //             console.log(error);
        
            //             return error;
            //         }
            //     } 
            //     else{
                    
            //     }  

            // });
            // console.log(results);
            //  if(results.length != 0 ){
            
            console.log("------------------------- not found -----------------------------\n");
            let current_datetime = new Date()
                    let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds()
                    //created_at,use_wallet,distance     +      "'" + data.request.use_wallet + "',"   +  
                    connection.query("INSERT INTO user_requests(created_at,user_id,use_wallet,distance,status) VALUES (" + "'" + formatted_date + "'," + "'" + data.request.id + "'," + "'" + data.request.use_wallet + "'," + "'" + data.request.distance +  "'," +'"SEARCHING"'+ ")", function (error, results, fields) {
                    //connection.query("INSERT INTO user_requests(created_at,user_id,use_wallet,distance) VALUES (" + "'" + formatted_date + "'," + "'" + data.request.id + "'," + "'" + data.request.use_wallet + "'," + "'" + data.request.distance +  "'" + ")", function (error, results, fields) {
                        if (!error) {
                            console.log("insert request in data base  and this is trib id", results.insertId);
                            settripid(data, results.insertId);
                            return results
            
                        } else {
                            console.log(error);
            
                            return error;
                        };
                    });
            //  }
            
            connection.end();
        }catch(err1){
            err1.where="Event: request_range_clients";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=data;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("------------------------The file was saved--------------------------------");
            }); 
        }
    });
    
    socket.on('check_request_clients', function (data) {
        try{
            console.log("request_range_clients event user",data);
            // setValues(data.request);
            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            });

            connection.connect();
            //////////////////////////////////////////////////////////////////////////////////////////
            connection.query("SELECT * FROM user_requests WHERE status != 'COMPLETED' AND  status != 'CANCELLED' AND user_id =?", [ data.request.id ],function (error, results, fields){
                console.log(results.length);          
                if(results.length = 0 ){
                    if (!error) {
                        console.log("insert request in data base  and this is trib id", results.insertId);
                    //   console.log(results);
                        console.log("------------------------- ruqest not completed -----------------------------\n");
                                            return results;
                                            
        
                    } else {
                        console.log(error);
        
                        return error;
                    }
                } 
                

            });
            
            
            connection.end();
        }catch(err1){
            err1.where="Event: check_request_client";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=data;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("--------------The file was saved--------------------");
            }); 
        }

    });

    socket.on('request_range_provider', function (data) {
        try{
            console.log("-------Request_Range_Provider Event Provider-------");
            console.log(data);
            console.log("---------------");

            if (data.Status == 'Reject') {
                console.log("-------------Status IS Reject---------");
                console.log("PRovider ID ",data.response.id);
                console.log("Trip ID ",data.request.Trip_id);
                //  console.log("request_range_provider event provider reject");
            // console.log(Providerss[data.response.id]);
                Providerss[data.response.id].emit('not_confirm', { Trip_id: data.request.Trip_id });
                DeleteFromRequestedProvider(data.response.id);

                // console.log("----------TripTone---------------");
                // console.log(ProvidersTripTune);
                // console.log("---------------------------------");

                // for (var i = 0; i < ProvidersTripTune[ data.request.Trip_id].length; i++) {

                //     if (ProvidersTripTune[data.request.Trip_id][i] ==data.response.id) {
                //         console.log("Found");
                //         DeleteFromRequestedProvider(ProvidersTripTune[data.request.Trip_id][i]);
                //     }
                // }

                // console.log("----------TripTone-2--------------");
                // console.log(ProvidersTripTune);
                // console.log("---------------------------------");

                // Providerss[data.response.id].emit('not_confirm', { Trip_id: data.request.Trip_id });

                console.log("------------------------------------");
            }
            else if (data.Status == 'Ignore') {
            }
            else if (data.Status == 'Accept' && Requests['Request' + data.request.id] != null) {
                console.log("request_range_provider event -- provider Accept -- ",data);

                Providerss[data.response.id].broadcast.emit('not_confirm', { Trip_id: data.request.Trip_id });
                deleteTripTuneFromRequestedProviders(data.response.id, data.request.Trip_id);
                console.log("-----------RequestedProviders---------WeWant-----------");
                console.log(RequestedProviders);
                console.log("---------------------------------------------------------");

                //deleteTripTuneFromRequestedProviders(data.response.id, data.request.Trip_id);
                // provider_email = data.response.email;
                if (requestScduleTrip != '') {
                    tripid = requestScduleTrip.request.request_id
                    // requestClient[data.request.id] = requestScduleTrip.request;
                }
                var connection = mysql.createConnection({
                    host: "localhost",
                    user: "root",
                    port: 3307,
                    password: "",
                    database: "ailbazco_db"
                });

                connection.connect();

                connection.query("UPDATE user_requests SET " +
                    "booking_id=0,user_id=?,provider_id=?," +
                    "current_provider_id=?,service_type_id=?,status=?," +
                    "s_address_ar=?,s_address_en=?,s_latitude=?,s_longitude=?," +
                    "d_address_ar=?,d_address_en=?,d_latitude=?,d_longitude=?," +
                    "updated_at=? WHERE id = ?", [
                    data.request.id, data.response.id,
                    data.request.id,
                    data.request.service_type,
                    'ACCEPTED',
                    data.request.s_address_ar,
                    data.request.s_address_en,
                    data.request.s_latitude,
                    data.request.s_longitude,
                    data.request.d_address_ar,
                    data.request.d_address_en,
                    data.request.d_latitude,
                    data.request.d_longitude,
                    new Date(),
                    data.request.Trip_id], function (error, results, fields) {
                        if (!error) {
                            console.log("data has been updated after driver accepted---------------------------------", results);
                            return results
                        } else {
                            console.log(error);
                            return error;
                        };

                    });
                connection.end();
                data.Trip_id = data.request.Trip_id;
                // Providerss[data.response.id].emit("accept", data);
                console.log("data send to client driver has been accepted your trip",data);
                //Clientss[data.request.id].emit('accept', data);
                console.log("-------------------"); 
                console.log('from socket ')   ;
                console.log(data);
                console.log("-------------------");

                ////////////////////////////////
                
                var connection = mysql.createConnection({
                    host: "localhost",
                    user: "root",
                    port: 3307,
                    password: "",
                    database: "ailbazco_db"
                });
                connection.connect();

                var arr;
                var serviceTypeID=0;
                var providerID=0;
                var x= 0;
                /*function test2x(){
                    return new Promise(function(resolve, reject){
                        connection.query(' SELECT provider_id,service_type_id,status FROM user_requests WHERE id =' +
                        "'" + data.request.Trip_id  + "'",function (error, results, fields){
                            if(!error){
                                resolve([results[0].provider_id,results[0].service_type_id,results[0].status]);
                                
                            }
                            else{
                                console.log("ERROR");
                                resolve("Errrror");
                            }
                        })
                    })
                }*/



                async function bobo2(){
                    //arr= await test2x();
                    providerID=data.response.id;
                    serviceTypeID=data.request.service_type;
                    status=data.Status;

                    function test22(){
                        return new Promise(function(resolve, reject){
                            connection.query(' SELECT car_id,first_name,last_name,email,rating,mobile,avatar FROM providers WHERE id = ' + "'" + providerID + "'" ,function (error, results, fields){
                                if(!error){
                                    resolve([results[0].car_id,results[0].first_name,results[0].last_name,results[0].email,results[0].rating,results[0].mobile,results[0].avatar]);
                                }
                                else{
                                    console.log("ERROR");
                                    resolve("Errrror");
                                }
                            })
                        })
                    }
                    arr2=await test22();
                    carID= arr2[0];
                    providerFirstName=arr2[1];
                    providerLastName=arr2[2];
                    providerEmail=arr2[3];
                    providerRating=arr2[4];
                    providerMobile=arr2[5];
                    providerAvatar=arr2[6];

                    function test23(){
                        return new Promise(function(resolve, reject){
                            connection.query(' SELECT car_model_id,color,car_number,car_left,car_right FROM cars WHERE id = ' + "'" + carID + "'" ,function (error, results, fields){
                                if(!error){
                                    resolve([results[0].car_model_id,results[0].color,results[0].car_number,results[0].car_left,results[0].car_right]);
                                }
                            })
                        })
                    }
                    arr3=await test23();
                    carModelID= arr3[0];
                    carColor= arr3[1];
                    carNumber= arr3[2];
                    carLeft= arr3[3];
                    carRight= arr3[4];

                    function test24(){
                        return new Promise(function(resolve, reject){
                            connection.query(' SELECT name,name_en FROM car_models WHERE id = ' + "'" + carModelID + "'" ,function (error, results, fields){
                                if(!error){
                                    resolve([results[0].name,results[0].name_en]);
                                }
                            })
                        })
                    }
                    arr4=await test24();
                    carModelAR= arr4[0];
                    carModelEN= arr4[1];

                    function test25(){
                        return new Promise(function(resolve, reject){
                            connection.query(' SELECT name,name_en FROM service_types WHERE id = ' + "'" + serviceTypeID + "'" ,function (error, results, fields){
                                if(!error){
                                    resolve([results[0].name,results[0].name_en]);
                                }
                            })
                        })
                    }
                    arr5=await test25();
                    serviceTypeAR= arr5[0];
                    serviceTypeEN= arr5[1];

                    // console.log("-------provider image--------");
                    // console.log(providerAvatar);
                    // console.log("---------------");

                    var obj = {
                        "trip_created_at":new Date(),
                        "tripID":data.request.Trip_id,
                        "clientID":data.request.id,
                        "providerID": providerID,
                        "providerFirstName": providerFirstName,
                        "providerLastName": providerLastName,
                        "providerEmail": providerEmail,
                        "providerRating": providerRating,
                        "providerMobile": providerMobile,
                        "providerAvatar": providerAvatar,
                        "tripStatus": data.Status,
                        "carNumber":carNumber,
                        "carColor":carColor,
                        "carLeft":carLeft,
                        "carRight":carRight,
                        "carModelAR":carModelAR,
                        "carModelEN":carModelEN,
                        "carID":carID,
                        "serviceTypeID": serviceTypeID,
                        "serviceTypeAR":serviceTypeAR,
                        "serviceTypeEN":serviceTypeEN,
                        "longitude":data.longitude,
                        "latitude":data.latitude,
                    }
                    var obgpickedUp = {
                        response: obj
                    }
                    Clientss[data.request.id].emit('accept', obgpickedUp);
                    console.log("accept");
                    
                    data.request.provider_email = data.response.email;
                    data.request.provider_phone = data.response.mobile;
        
                    emitOn(Providerss[data.response.id], 'confirm', { case: "true", message: "hello fred", Trip_id: data.Trip_id.toString(), provider_email: data.response.email, provider_phone: data.response.mobile }, data.id);
                    AcceptedRequests['Request' + data.request.id] = data.request;
                    AcceptedRequests['Request' + data.request.id].aldrejected = Requests['Request' + data.request.id].request.rejectedProviders;
                    delete Requests['Request' + data.request.id];
                }
                bobo2();
                
                //////////////////////////////////



            } else {
                emitOn(io, 'confirm', 'false', Providers[data.response.id].socket_id);
            }
        }catch(err1){
            err1.where="Event: request_range_provider";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=data;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("-------------The file was saved-----------------------");
            }); 
        }

    });

    socket.on("Arrived_provider", function (datas) {
        try{
            console.log("Arrived_provider data");

            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            });

            connection.connect();
            console.log("Arrived_provider data 1");

            connection.query(' UPDATE user_requests SET   status =  ' +
                '"ARRIVED"' + "," + " updated_at ="
                + "  NOW() " + "," + " arrived_at =" + "  NOW() " +
                ' WHERE id = ' +
                "'" + datas.Trip_id + "'" +
                '   ', (error, results, fields) => {
                    if (!error) {
                        // console.log("Arrived_provider results", results);
                        return results

                    } else {
                        console.log(error)
                        return error;
                    }
                });
            connection.end();

            console.log("Arrived_provider data 2");

            //////////////
            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            });
            connection.connect();

            console.log("Arrived_provider data 3");
            //var arr;
            //var serviceTypeID=0;
            //var providerID=0;
            //var x= 6003;
            function test(){
                return new Promise(function(resolve, reject){
                    
                    connection.query(' SELECT provider_id,service_type_id,status,user_id FROM user_requests WHERE id =' +
                    "'" + datas.Trip_id + "'",function (error, results, fields){
                        if(!error){
                            resolve([results[0].provider_id,results[0].service_type_id,results[0].status,results[0].user_id]);
                        }
                        else{
                            console.log('Error');
                        }
                    })

                    if(reject){
                        console.log('Reject Error Occurred'); 
                    }

                })
            }

            console.log("Arrived_provider data 4");


            async function bobo(){
                console.log("async 00");
                arr= await test();
                console.log("async 01");
                providerID=arr[0];
                serviceTypeID=arr[1];
                status=arr[2];
                clientID=arr[3];
                tripID=datas.Trip_id;
                console.log("async 1");
                function test2(){
                    return new Promise(function(resolve, reject){
                        connection.query(' SELECT car_id,avatar FROM providers WHERE id = ' + "'" + providerID + "'" ,function (error, results, fields){
                            if(!error){
                                resolve([results[0].car_id,results[0].avatar]);
                            }
                        })
                    })
                }
                arr2=await test2();
                carID= arr2[0];
                providerAvatar=arr2[1];

                console.log("async 2");
                function test3(){
                    return new Promise(function(resolve, reject){
                        connection.query(' SELECT car_model_id,color,car_number,car_left,car_right FROM cars WHERE id = ' + "'" + carID + "'" ,function (error, results, fields){
                            if(!error){
                                resolve([results[0].car_model_id,results[0].color,results[0].car_number,results[0].car_left,results[0].car_right]);
                            }
                        })
                    })
                }
                arr3=await test3();
                carModelID= arr3[0];
                carColor= arr3[1];
                carNumber= arr3[2];
                carLeft= arr3[3];
                carRight= arr3[4];

                console.log("async 3");
                function test4(){
                    return new Promise(function(resolve, reject){
                        connection.query(' SELECT name,name_en FROM car_models WHERE id = ' + "'" + carModelID + "'" ,function (error, results, fields){
                            if(!error){
                                resolve([results[0].name,results[0].name_en]);
                            }
                        })
                    })
                }
                arr4=await test4();
                carModelAR= arr4[0];
                carModelEN= arr4[1];

                console.log("async 4");
                function test5(){
                    return new Promise(function(resolve, reject){
                        connection.query(' SELECT name,name_en FROM service_types WHERE id = ' + "'" + serviceTypeID + "'" ,function (error, results, fields){
                            if(!error){
                                resolve([results[0].name,results[0].name_en]);
                            }
                        })
                    })
                }
                arr5=await test5();
                serviceTypeAR= arr5[0];
                serviceTypeEN= arr5[1];

                console.log("async 5");
                var obj = {
                    "trip_created_at":new Date(),
                    "tripID":tripID,
                    "clientID":clientID,
                    "providerID":providerID,
                    "providerFirstName": datas.first_name,
                    "providerLastName": datas.last_name,
                    "providerEmail": datas.email,
                    "providerRating": datas.rating,
                    "providerMobile": datas.mobile,
                    "providerAvatar": providerAvatar,
                    "tripStatus": status,
                    //"carModelID":carModelID,
                    "carNumber":carNumber,
                    "carColor":carColor,
                    "carLeft":carLeft,
                    "carRight":carRight,
                    "carModelAR":carModelAR,
                    "carModelEN":carModelEN,
                    //"carID":carID,
                    //"serviceTypeID": serviceTypeID,
                    "serviceTypeAR":serviceTypeAR,
                    "serviceTypeEN":serviceTypeEN
                }
                
                var obgpickedUp = {
                    response: obj
                }
                console.log("Arrived_provider data 5");
                Clientss[datas.client_id].emit('arrived', obgpickedUp);

                console.log("Arrived_provider data 6");
                
            }
            bobo().catch(function () {
                console.log("893 Error");
           });
            console.log("Arrived_provider data 7");
            //////////////
        }catch(err1){
            err1.where="Event: Arrived_provider";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=datas;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("--------------------------The file was saved--------------------");
            }); 
        }
    });

    socket.on("pickedUp_provider", function (pickkkk) {
        try{
            console.log("pickedUp_provider event");
            console.log(pickkkk);
            //pickkkk.Trip_id=585;

            var slatandslotcorrrect = ' ';
            if (pickkkk.D_lat > "0.0" && pickkkk.D_long > "0.0") {
                slatandslotcorrrect = ", s_latitude =" + "'" + pickkkk.D_lat + "'" + ", s_longitude =" + "'" + + pickkkk.D_long + "'";
            }

            if (requestScduleTrip != '') {
                tripid = requestScduleTrip.request.request_id
            }

            console.log("pickkkk.Trip_id: ",pickkkk.Trip_id);

            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            });

            connection.connect();
            connection.query(' UPDATE user_requests SET   status =  ' +
                '"STARTED"' + ", updated_at ="
                + "NOW()   " + ", started_at =" + "NOW()   " + slatandslotcorrrect +
                ' WHERE id = ' +
                "'" + pickkkk.Trip_id + "'" +
                '   ', (error, results, fields) => {

                    if (!error) {
                        console.log(results);

                        return results
                    }
                    
                    else {
                        console.log(error)
                        ////results=null;
                        return error;
                        ////throw new Error('Error Occurred'); 
                    }

                });

            connection.query('select updated_at ,user_id from user_requests ' +
            ' WHERE id = ' +
            "'" + pickkkk.Trip_id + "'" +
            '', (error, results, fields) => {

                console.log("results:  ",results[0]);

            if (!error) {
                //if(results[0] !=null){
                    setPickupDate(results[0].updated_at);
                    var user_id = results[0].user_id
                    console.log(results[0].updated_at);
                    function setPickupDate(data) {
                        pickupDate = data;
                    }

                    var obj = {
                        "first_name": pickkkk.first_name,
                        "last_name": pickkkk.last_name,
                        "email": pickkkk.email,
                        "rating": pickkkk.rating,
                        "mobile": pickkkk.mobile,
                        "picture": pickkkk.picture
                    }
                    var obgpickedUp = {
                        response: obj
                    }

                    Providerss[pickkkk.provider_id].emit("pickedUp", obgpickedUp);//user
                    Clientss[user_id].emit('pickedUp', obgpickedUp);
                    return results

                //}
                // else{
                    
                // }

            } else {
                console.log(error)
                return error;
                //throw new Error('Error Occurred'); 
            }

            });
            
                
            connection.end();

           

        }catch(err1){
            err1.where="Event: pickedUp_provider";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=pickkkk;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("------------------The file was saved----------------------");
            }); 
        }
        
    });

    socket.on("dropped_provider", function (dropedddd) {
        try{
            console.log("dropped_provider event");
            console.log("-----------------dropped_provider-----------------");
            console.log(dropedddd);
            console.log("----------------------------------------");
            var dlatanddlotcorrrect = ' ';
            if (dropedddd.D_lat > "0.0" && dropedddd.D_long > "0.0") {
                dlatanddlotcorrrect = ", d_latitude =" + "'" + dropedddd.D_lat + "'" + ", d_longitude =" + "'" + dropedddd.D_long + "'";
            }
            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            });

            connection.connect();

            connection.query(' UPDATE user_requests SET   status =  ' +
                '"DROPPED"' + ", updated_at ="
                + "  NOW()   " + ", finished_at =" + "  NOW()   " + dlatanddlotcorrrect +

                ' WHERE id = ' +
                "'" + dropedddd.Trip_id + "'" +
                '   ', (error, results, fields) => {
                    if (!error) {
                        return results;
                    } else {
                        console.log({ error: error })
                        return error;
                    }
                });


            connection.end();

            console.log(dropedddd.Trip_id);

            //try{
                var info = {};
                request.post(
                    //'http://5.189.186.251/ailbaz_server/public/api/provider/create_trip_payment',
                    'http://5.189.186.251/ailbaz_server/public/api/provider/calculate_payment',
                    //'http://5.189.186.251/ailbaz_server/public/api/test',
                    {
                        json: {
                            "Trip_id": dropedddd.Trip_id
                        }
                    },
                    function (error, response, body) {
                        //console.log(response.body);
                        //response.statusCode = 200;
                        if (!error && response.statusCode == 200) {
                            //return 0;
                            if (typeof response.body != undefined) {
                                //console.log("vvvvvvvvvvvvvvvvvv", response.body.data);

                                var bill = {
                                    fixed_price: Math.round(response.body.data.fixed * 10) / 10,//????? ??????
                                    distance: Math.round(response.body.data.distance * 10) / 10,//???????
                                    distance_price: Math.round(response.body.data.price * response.body.data.distance * 10) / 10,//????? ???????
                                    wattingTime: Math.round(response.body.data.WaitingTime),//??? ????????
                                    time_price: Math.round(response.body.data.min_wait_price * 10) / 10,//????? ????????
                                    tripTime: Math.round(response.body.data.time_trip),//??? ??????
                                    watting_price: Math.round(response.body.data.time_trip_price *10) / 10,//????? ??? ??????

                                    tax: Math.round(response.body.data.tax * 10) / 10,//???????
                                    total_price: Math.round(response.body.data.total * 10) / 10,//???????? 
                                    gift: Math.round(response.body.data.gift * 10) / 10,
                                    total_before_gift: Math.round(response.body.data.total_before_gift * 10) / 10,

                                // watting_price: Math.round(response.body.data.WaitingPrice * 10) / 10,

                                    discount_wallet: Math.round(response.body.data.discount_wallet * 10) / 10,//????? ?? ????
                                    Trip_id: dropedddd.Trip_id
                                };

                                console.log("----------Bill In Dropped---------");
                                console.log(bill);
                                console.log("-----------------------");

                                //var info = {};
                                info.bill = bill;
                                //console.log("bill", info);
                                
                                try{
                                    Providerss[dropedddd.provider_id].emit('bill', info);
                                    Clientss[dropedddd.userID].emit('bill', info);
                                }catch(err1){
                                    err1.where="Event: dropped_provider-1";
                                    err1.date=new Date().toLocaleString();
                                    err1.body=err1.stack;
                                    err1.data=dropedddd;
                            
                                    fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                                        if(err) {
                                            return console.log(err);
                                        }
                        
                                        fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                                            if(err) {
                                                return console.log(err);
                                            }
                                        });
                            
                                        fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                                            if(err) {
                                                return console.log(err);
                                            }
                                        });
                            
                                        console.log("------------------The file was saved--------------------");
                                    }); 
                                }

                                // if(Clientss[dropedddd.userID]){
                                    
                                //     Clientss[dropedddd.userID].emit('bill', info);
                                // }else{
                                //     console.log("------------No User ID---------------");
                                // }
                            }
                        }
                        else{
                            console.log(body);
                        }
                    }

                    
                );

                //console.log({info});
                // Providerss[dropedddd.provider_id].emit('bill', info);
                // Clientss[dropedddd.userID].emit('bill', info);
                
            // }catch(err){
            //     console.log(err);
            // }
        }catch(err1){
            err1.where="Event: dropped_provider";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=dropedddd;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("------------------The file was saved--------------------");
            }); 
        }
    });

    socket.on('ConfirmPaid_provider', function (data) {
        try{
            console.log("---------------ConfirmPaid------------");
            console.log(data);
            console.log("---------------------------------");

            console.log("ConfirmPaid_provider event")
            console.log(data,Providers)
            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            });

            connection.connect();
            connection.query(' UPDATE user_requests SET   status =  ' +
                '"COMPLETED"' + ", updated_at ="
                + "  NOW()   " + ", paid =" +
                +  1 +

                ' WHERE id = ? '
                , [data.Trip_id], (error, results, fields) => {

                    if (!error) {
                        return results
                    } else {
                        console.log(error)
                        return error;
                    }
                });
            connection.end();
            // Providerss[data.provider_id].emit('ConfirmPaid', data);
            DeleteFromRequestedProvider(data.provider_id);     
            
            //////////////////////

            //try{
                request.post(
                    'http://5.189.186.251/ailbaz_server/public/api/provider/create_trip_payment',
                    //'http://5.189.186.251/ailbaz_server/public/api/provider/calculate_payment',
                    //'http://5.189.186.251/ailbaz_server/public/api/test',
                    {
                        json: {
                            "Trip_id": data.Trip_id
                        }
                    },
                    function (error, response, body) {
                        //console.log(response.body);
                        //response.statusCode = 200;
                        if (!error && response.statusCode == 200) {
                            //return 0;
                            if (typeof response.body != undefined) {
                                //console.log("vvvvvvvvvvvvvvvvvv", response.body.data);

                                var bill = {
                                    fixed_price: Math.round(response.body.data.fixed * 10) / 10,//????? ??????
                                    distance: Math.round(response.body.data.distance * 10) / 10,//???????
                                    distance_price: Math.round(response.body.data.price * response.body.data.distance * 10) / 10,//????? ???????
                                    wattingTime: Math.round(response.body.data.WaitingTime),//??? ????????
                                    time_price: Math.round(response.body.data.min_wait_price * 10) / 10,//????? ????????
                                    tripTime: Math.round(response.body.data.time_trip),//??? ??????
                                    watting_price: Math.round(response.body.data.time_trip_price *10) / 10,//????? ??? ??????

                                    tax: Math.round(response.body.data.tax * 10) / 10,//???????
                                    total_price: Math.round(response.body.data.total * 10) / 10,//???????? 

                                // watting_price: Math.round(response.body.data.WaitingPrice * 10) / 10,

                                    discount_wallet: Math.round(response.body.data.discount_wallet * 10) / 10,//????? ?? ????
                                    gift:  Math.round(response.body.data.gift * 10) / 10,
                                    total_before_gift:  Math.round(response.body.data.total_before_gift * 10) / 10,
                                    Trip_id: data.Trip_id
                                };

                                console.log("----------Bill In Confirm---------");
                                console.log(bill);
                                console.log("-----------------------");

                                var info = {};
                                info.bill = bill;
                                //console.log("bill", info);
                                //Providerss[dropedddd.provider_id].emit('bill', info);
                                //Clientss[dropedddd.userID].emit('bill', info);

                            }
                        }
                        else{
                            console.log(body);
                        }
                    }

                    
                );
            // }catch(err){
            //     console.log(err);
            // }
            
            ///////////////////////

            //try{
                //var err =0;
                //console.log("---Clients----");
                //Clientss[data.userID] = socket;
                // Clientss[0]="Aloo";
                // console.log(Clientss);

                // var connection = mysql.createConnection({
                //     host: "localhost",
                //     user: "root",
                //     port: 3307,
                //     password: "",
                //     database: "ailbazco_db"
                // });
    

                // connection.connect();
                // connection.query(' SELECT car_id,first_name,last_name,email,rating,mobile,avatar FROM providers WHERE id = ' + "'" + data.provider_id + "'" ,function (error, results, fields) {
                //     if (!error) {
                //         if (results.length == 0) {
                //             console.log("result get data from data base  is null");
                //             setvaluedatescdule(null)
                //         } else {
                //             console.log("result get data from data base ", results[0]);
                //             setvaluedatescdule(results[0].schedule_at.toLocaleString(), results[0].tripid, results[0].s_address_ar, results[0].s_address_en, results[0].d_address_ar, results[0].d_address_en, results[0].mobile, results[0].email, results[0].id);
                //         }
                //     } else {
                //         console.log("error get data from data base", error);
                //         return error;
                //     };
                // });
                // connection.end();
                

                var data2={
                    "trip_created_at": "",
                    "tripID": data.Trip_id,
                    "clientID": "",
                    "providerID": data.provider_id,
                    "providerFirstName": data.first_name,
                    "providerLastName": data.last_name,
                    "providerEmail": "",
                    "providerRating": "",
                    "providerMobile": "",
                    "providerAvatar": data.picture,
                    "tripStatus": "",
                    "carNumber": "",
                    "carColor": "",
                    "carLeft": "",
                    "carRight": "",
                    "carModelAR": "",
                    "carModelEN": "",
                    "serviceTypeAR": "",
                    "serviceTypeEN": ""
                    
                };

                //data
                Clientss[data.userID].emit('ConfirmPaid', data2);
                //console.log("------delete-------");
                // console.log("-----endDelete-------");
            // }
            // catch(err){
            //     console.log(err);
            // }

            delete TripsProviderAfterWating[data.Trip_id];
        }catch(err1){
            err1.where="Event: ConfirmPaid_provider";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=data;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("--------------------The file was saved---------------------");
            }); 
        }
    });

    socket.on('provider_after_waiting', function (datastripId) {
        try{
        console.log("----------provider_after_waiting------------");
        console.log(datastripId);
        console.log("-------------");
        TripsProviderAfterWating.push(datastripId);
        }catch(err1){
            err1.where="Event: provider_after_waiting";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=datastripId;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("--------------The file was saved-----------------");
            }); 
        }
    });

    socket.on('cancel_trip_system', function (datas) {
        try{
            console.log("cancel_trip_system event");
            console.log("--------CancelSystem-------------");
            console.log(datas);
            console.log("-------------------");

            if ( datas.tripID == '0'|| datas.tripID == '' ) {
                console.log("Entered In First Condition");

                console.log("------------ClientsArray--------------");
                console.log(Clients);
                console.log("------------------------------------");

                if (datas.clientID != '' && datas.clientID != '0') {
                    datas.tripID = Requests['Request' + datas.clientID].request.Trip_id;
                }
                
                console.log("-----------newTripID-----------");
                console.log(datas.tripID);
                console.log("---------");

                var connection = mysql.createConnection({
                    host: "localhost",
                    user: "root",
                    port: 3307,
                    password: "",
                    database: "ailbazco_db"
                });

                connection.connect();
                connection.query(' UPDATE user_requests SET   status =  ' +
                    '"CANCELLED"' + "," + " updated_at ="
                    + "  NOW() " +
                    "," + " cancelled_by = " + "'system'" +
                    "," + " cancel_reason ="
                    + "'" + "..." + "'" +
                    ' WHERE id = ' +
                    "'" + datas.tripID + "'" +
                    '   ', (error, results, fields) => {
                        if (!error) {
                            console.log(results);
                            return results
                        } else {
                            console.log(error);
                            return error;
                        }

                });
                console.log("Changed TripID.0 In DaataBase");

                connection.end();
                delete Requests['Request' + datas.clientID];
                if (datas.clientID != '' && datas.clientID != '0') {
                    console.log("start_not_confirm start_not_confirm start_not_confirm start_not_confirm");
                    Clientss[datas.clientID].broadcast.emit('start_not_confirm', { Trip_id: datas.tripID });

                }

                //delete ProvidersTripTune[datas.Trip_id];

            } else{
            ////
                console.log("Entered In Second Condition");
                var connection = mysql.createConnection({
                    host: "localhost",
                    user: "root",
                    port: 3307,
                    password: "",
                    database: "ailbazco_db"
                });

                connection.connect();
                connection.query(' UPDATE user_requests SET   status =  ' +
                    '"CANCELLED"' + "," + " updated_at ="
                    + "  NOW() " +
                    "," + " cancelled_by = " + "'system'" +
                    "," + " cancel_reason ="
                    + "'" + "..." + "'" +
                    ' WHERE id = ' +
                    "'" + datas.tripID + "'" +
                    '   ', (error, results, fields) => {
                        if (!error) {
                            console.log(results);
                            return results
                        } else {
                            console.log(error);
                            return error;
                        }

                });

                connection.end();

                console.log("-----------------Request-------------");
                console.log(Requests['Request' + datas.clientID]);
                console.log("-------------------");
                delete Requests['Request' + datas.clientID];
                
                    if (datas.clientID != '' && datas.clientID != '0') {
                        console.log("start_not_confirm start_not_confirm start_not_confirm start_not_confirm");
                        console.log("----beforeEmit------");
                        Clientss[datas.clientID] = socket;
                        console.log("-------ClientsArray------------------");
                        console.log(Clientss[datas.clientID]);
                        console.log("--------------------");
                        try{
                            Clientss[datas.clientID].broadcast.emit('start_not_confirm', { Trip_id: datas.tripID });
                            console.log("Emit,cancel by system");
                            console.log(datas.tripID);
                        }catch(err){
                            console.log(err);
                        }
                        
                        console.log("--------endOfEmit------");
                    }
                //     console.log("-----------------Providers-------------");
                //     console.log(ProvidersTripTune[datas.Trip_id]);
                //     console.log("-------------------");
                // delete ProvidersTripTune[datas.Trip_id];

            ///
            }
            ////
            deleteTripTuneFromRequestedProviders(0, datas.tripID);
            console.log(RequestedProviders);
            console.log("----------endOfEvent--Of Cancel By System-------");
        }catch(err1){
            err1.where="Event: cancel_trip_system";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=datas;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("---------------The file was saved---------------------");
            }); 
        }
    });

    socket.on('cancel_trip_provider', function (datas) {
        try{
            console.log("----------------cancel_trip_provider Event--------------");
            console.log(datas);
            console.log("------------------");
            
            //console.log("cancel_trip_provider event");
            DeleteFromRequestedProvider(datas.provider_id);

            console.log("--TripsProviderAfterWaiting---");
            console.log(TripsProviderAfterWating);
            console.log("----------------------");
            
            if (TripsProviderAfterWating.includes(datas.Trip_id) == true) {
                delete TripsProviderAfterWating[datas.Trip_id];
                providerCancelTripAndAddTripCostFromUserToProvider(datas.provider_id,datas.Trip_id,datas.UserID,datas.serviceType);
            }
            else {

                var connection = mysql.createConnection({
                    host: "localhost",
                    user: "root",
                    port: 3307,
                    password: "",
                    database: "ailbazco_db"
                });

                connection.connect();
                //  update status trip
                connection.query(' UPDATE user_requests SET   status =  ' +
                    '"SEARCHING"' + "," + " updated_at ="
                    + "  NOW() " + "," + " provider_id ="+ "'" + datas.provider_id + "'" +
                    ' WHERE id = ' +
                    "'" + datas.Trip_id + "'" +
                    '   ', (error, results, fields) => {
                        if (!error) {
                            return results
                        } else {
                            console.log(error)
                            return error;
                        }
                    });

                connection.query("SELECT user_requests.*, users.* ,user_requests.id as tripid    FROM user_requests INNER JOIN users ON user_requests.user_id=users.id where  user_requests.id = ? LIMIT 1", [datas.Trip_id], function (error, results, fields) {
                    if (!error) {
                        if (results.length == 0) {
                            console.log("Cancel By Provider Event : result get data from data base  is null no trip or error in trip id");
                        } else {
                            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                            // console.log("result get data from data base this trip", results[0]);
                            var data = results[0];

                            var datasrequest = {
                                s_latitude: data.s_latitude.toString(),
                                s_longitude: data.s_longitude.toString(),
                                d_latitude: data.d_latitude.toString(),
                                d_longitude: data.d_longitude.toString(),
                                first_name: data.first_name,
                                last_name: data.last_name,
                                email: data.email,
                                picture: data.picture,
                                rating: data.rating.toString(),
                                mobile: data.mobile,
                                status: 'SEARCHING',
                                booking_id: '',
                                s_address_ar: data.s_address_ar,
                                s_address_en: data.s_address_en,
                                d_address_ar: data.d_address_ar,
                                d_address_en: data.d_address_en,
                                id: data.id.toString(),
                                service_type: data.service_type_id.toString(),
                                distance: data.distance.toString(),
                                schedule_date: data.schedule_at ==null ? "":data.schedule_at.toString(),
                                schedule_time: data.schedule_at ==null ? "":data.schedule_at.toString(),
                                use_wallet: data.use_wallet,
                                payment_mode: data.payment_mode,
                                request_id: data.tripid,
                                Trip_id: data.tripid,
                            }


                            // var obj = {
                            //     "first_name": " ",
                            //     "last_name": " ",
                            //     "email": " ",
                            //     "rating": "5",
                            //     "mobile": " ",
                            //     "picture": "",
                            //     "id":""
                            // }

                            var obj={
                                "tripID":datas.Trip_id,
                                "clientID":datas.UserID,
                                "providerID":datas.provider_id
                            }
                            var obgpickedUp = {
                                response: obj
                            }
                            // console.log("provider_cancel_your_trip_is_searching");
                            console.log("provider_cancel_your_trip_is_searching obj",obj);
                            Clientss[datas.UserID].emit('provider_cancel_your_trip_is_searching', obgpickedUp);
                            datasrequest.rejectedProviders = AcceptedRequests['Request' + data.id].aldrejected;
                            datasrequest.rejectedProviders.push(parseInt(datas.provider_id));
                            console.log("datasrequest rejectedProviders length", datasrequest.rejectedProviders.length);
                            console.log("datasrequest rejectedProviders", datasrequest.rejectedProviders);
                            if (datasrequest.rejectedProviders.length < 2) {
                                
                                var datarequest = { request: datasrequest }
                                requestScduleTrip = datarequest;
                                datarequest.UserId = data.id.toString();
                                Requests['Request' + data.id] = datarequest;
                                SendRequest(Requests['Request' + data.id]);
                            }
                            else {
                                // save cancel in to data base from all providers
                                cancelFromAllProviders(datas.Trip_id, data.id)
                            }
                            console.log("---------- Cancel Trip By Provider ------------");
                            console.log(RequestedProviders);
                            console.log("---------- Cancel Trip By Provider ------------");
                            // console.log(RequestedProviders);
                        }
                    } else {
                        console.log("result from data base after provider cancel", error);
                        return error;
                    };
                });
                connection.end();

                // end
            }
            //  save cancel reson driver in to data base 

            let current_datetime = new Date()
            let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds()
            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            });

            connection.connect();
            connection.query("INSERT INTO" +
                " provider_user_requests(" +
                "provider_id," +
                "user_request_id," +
                "cancel_reason," +
                "updated_at," +
                "created_at" +
                ") VALUES (" +
                "'" + datas.provider_id + "'" + "," +
                "'" + datas.Trip_id + "'" + "," +
                "'" + datas.reason + "'" + "," +
                "'" + formatted_date + "'" + "," +
                "'" + formatted_date + "'" + ")", (error, results, fields) => {
                    if (!error) {
                        console.log(results);
                        return results
                    } else {
                        console.log(error);
                        return error;
                    };
                });
            connection.end();
        }catch(err1){
            err1.where="Event: cancel_trip_provider";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=datas;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("-------------The file was saved-------------------");
            }); 
        }
    });

    socket.on('cancel_trip_user', function (datas) {
        try{    
            console.log("cancel_trip_User event");
            console.log("--------CancelUser-------------");
            console.log(datas);
            console.log("-------------------");
            
            console.log("cancel event from user ", datas);
            
            if(datas.sub == 0){

                
                    console.log("---------------In Sub Zero-----------")

                    userCancelPutProviderNotArrived(datas);
                    DeleteFromRequestedProvider(datas.provider_id);
                    var obj = {
                        "first_name": " ",
                            "last_name": " ",
                            "email": " ",
                            "rating": "5",
                            "mobile": " ",
                            "picture": "",
                            "id":""
                    }
                    var obgpickedUp = {
                        response: obj
                    }
                    Clientss[datas.client_id].emit('user_cancel_trip_after_waiting', obgpickedUp);



            }else if(datas.sub == 1 ){

                if ((datas.provider_id == '0' || datas.provider_id == '') && (datas.Trip_id == '0'|| datas.Trip_id == '')) {
            
                    if (datas.client_id != '' && datas.client_id != '0') {
                        datas.Trip_id = Requests['Request' + datas.client_id].request.Trip_id;
                    }
        
                    var connection = mysql.createConnection({
                        host: "localhost",
                        user: "root",
                        port: 3307,
                        password: "",
                        database: "ailbazco_db"
                    });
        
                    connection.connect();
                    // reason
                    connection.query(' UPDATE user_requests SET   status =  ' +
                        '"CANCELLED"' + "," + " updated_at ="
                        + "  NOW() " +
                        "," + " cancelled_by = " + "'USER'" +
                        "," + " cancel_reason ="
                        + "'" + datas.reason + "'" +
                        ' WHERE id = ' +
                        "'" + datas.Trip_id + "'" +
                        '   ', (error, results, fields) => {
                            if (!error) {
                                console.log(results);
                                return results
                            } else {
                                console.log(error);
                                return error;
                            }
        
                        });
        
                    connection.end();

                    delete Requests['Request' + datas.client_id];
                    if (datas.client_id != '' && datas.client_id != '0') {
                        console.log("start_not_confirm start_not_confirm start_not_confirm start_not_confirm");
                        Clientss[datas.client_id].broadcast.emit('start_not_confirm', { Trip_id: datas.Trip_id });
                        console.log("------Client Socket-----------");
                        console.log(Clientss[datas.client_id]);
                        console.log("---------------------");
        
                    }
                    
                    for (var i = 0; i < ProvidersTripTune[datas.Trip_id].length; i++) {
                        Providerss[ProvidersTripTune[datas.Trip_id][i]].broadcast.emit('not_confirm', { Trip_id: datas.Trip_id });

                        console.log("-----------Provider Socket-------------------")
                        console.log(Providerss[ProvidersTripTune[datas.Trip_id][i]]);
                        console.log("------------------");

                            DeleteFromRequestedProvider(ProvidersTripTune[datas.Trip_id][i]);
                    }
        
                    delete ProvidersTripTune[datas.Trip_id];
        
                } else {
        
                    // if trip status arrived add base cost  to driver
                    console.log(" befor chick user cancel after driver arrived");
                    // console.log("//////////////////////////////////////",datas);
        
                    var connection = mysql.createConnection({
                        host: "localhost",
                        user: "root",
                        port: 3307,
                        password: "",
                        database: "ailbazco_db"
                    });
                    connection.connect();
            
                    connection.query('select * from user_requests' +
                    ' WHERE id = ' +
            
                    "'" + datas.Trip_id + "'" +
                    '', (error, results, fields) => {
                        if(datas.provider_id == '' || datas.provider_id == null ){
                            datas.provider_id = results[0].provider_id;
                        }
                        // console.log("get data from data base this data is ",datas.provider_id);
                        if (!error) {
                            console.log("get data from data base this data is ",results[0].status );
                                    //||  results[0].status == 'ACCEPTED'
                                    if(results[0].status == 'ARRIVED' ){
                                        console.log("user cancel after driver arrived or accepted");
                                        usercCancelTripAndAddTripCostFromUserToProvider(datas.provider_id,datas.Trip_id,datas.client_id,datas.reason );
                                    }
                                    else{
                                        console.log("user cancel befor driver arrived");
                                        userCancelPutProviderNotArrived(datas);

                                        var obj = {
                                            "first_name": " ",
                                                "last_name": " ",
                                                "email": " ",
                                                "rating": "5",
                                                "mobile": " ",
                                                "picture": "",
                                                "id":""
                                                
                                        }
                                        var obgpickedUp = {
                                            response: obj
                                        }
                                        Clientss[datas.client_id].emit('user_cancel_trip_after_waiting', obgpickedUp);
                                    }
                                DeleteFromRequestedProvider(datas.provider_id);
                        } else {
                            console.log(error);
                        }
            
                    });
                    connection.end();
                }

            }

            // console.log("///////////////////////////////////////",datas.Trip_id)
            delete TripsProviderAfterWating[datas.Trip_id];
        }catch(err1){
            err1.where="Event: cancel_trip_user";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=datas;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("------------------The file was saved----------------------");
            }); 
        }
    });

    socket.on('schedule_trip', function (data) {
        try{
            console.log("schedule_trip event");

            var strdatescdule = data.schedule_date.toString();
            var strtimeschdule = data.schedule_time.toString();

            // console.log("DSsd");
            // function reverseString(strdatescdule) {
            var splitString = strdatescdule.split('-');
            var reverseArray = splitString.reverse();
            var joinArray = reverseArray.join("-");

            var dateSchedule = joinArray + " " + strtimeschdule;


            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            })

            connection.connect();

            connection.query("SELECT schedule_at  FROM user_requests WHERE user_id = ? and schedule_at IS NOT NULL", [data.id], function (error, results, fields) {
                if (!error) {

                    if (results.length == 0) {
                        ifCondetionScdule(null)
                    } else {
                        ifCondetionScdule(results[0].schedule_at);

                    }

                    return results
                } else {
                    console.log(error);
                    return error;
                };

            });

            connection.end();

            function ifCondetionScdule(datas) {
                console.log(datas);
                if (datas == null) {
                    console.log({ servicetype: data })
                    var connection = mysql.createConnection({
                        host: "localhost",
                        user: "root",
                        port: 3307,
                        password: "",
                        database: "ailbazco_db"
                    })

                    connection.connect();
                    connection.query("INSERT INTO" +
                        " user_requests(" +
                        " schedule_at," +
                        " booking_id," +
                        "user_id," +
                        "current_provider_id," +
                        "service_type_id," +
                        "status," +
                        "payment_mode," +
                        "distance," +
                        "s_address_ar," +
                        "s_address_en," +
                        "s_latitude," +
                        "s_longitude," +
                        "d_address_ar," +
                        "d_address_en," +
                        "d_latitude," +
                        "d_longitude" +

                        ") VALUES (" +
                        "'" + dateSchedule + "'" + "," +
                        "'" + data.booking_id + "'" + "," +
                        "'" + data.id + "'" + "," +
                        "'" + data.id + "'" + "," +

                        "'" + data.service_type + "'" + "," +
                        "'SCHEDULED'" + "," +
                        "'" + data.payment_mode + "'" + "," +
                        "'" + data.distance + "'" + "," +
                        "'" + data.s_address_ar + "'" + "," +
                        "'" + data.s_address_en + "'" + "," +
                        "" + data.s_latitude + "" + "," +
                        "" + data.s_longitude + "" + "," +
                        "'" + data.d_address_ar + "'" + "," +
                        "'" + data.d_address_en + "'" + "," +
                        "" + data.d_latitude + "" + "," +
                        "" + data.d_longitude + ")", (error, results, fields) => {
                            if (!error) {
                                refechUserLogin(data.id);
                                console.log("schudual trip and this data", results);
                                // return inserts.push(results)
                                return results
                                // res.push(results);
                            } else {
                                console.log(error);
                                return error;
                            };
                        });

                    connection.end();
                    checkescduletrip("done", data)
                } else {
                    checkescduletrip("false", data)
                }
            }

            function checkescduletrip(data, datas) {
                console.log({ datas: datas })
                var obj = "";
                if (data == 'done') {
                    obj = {
                        schedule: {
                            schedule_date: datas.schedule_date,
                            schedule_time: datas.schedule_time,
                            message: "is done",
                            status: "1"
                        }, request: {
                            datas
                        }
                    };
                    Clientss[datas.id].emit('confirm_save_schedule_trip', obj);
                } else {
                    var obj =
                    {
                        schedule: {
                            schedule_date: datas.schedule_date,
                            schedule_time: datas.schedule_time,
                            message: "is dont save",
                            status: "0"
                        }, request: {
                            datas
                        }
                    };

                    Clientss[datas.id].emit('confirm_save_schedule_trip', obj);

                }
            }
        }catch(err1){
            err1.where="Event: schedule_trip";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=data;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("------------------------The file was saved--------------------------");
            }); 
        }
    });


    socket.on('confirm_schedule_trip', function (status) {
        try{
            console.log("confirm_schedule_trip event");
            if (status.confirm == '0') {
                /////connect to my sqli 
                var connection = mysql.createConnection({
                    host: "127.0.0.1",
                    user: "root",
                    port: 3307,
                    password: "",
                    database: "ailbazco_db"
                });
                connection.connect();
                connection.query(' UPDATE user_requests SET   status =  ' +
                    '"CANCELLED"' + "," + " updated_at ="
                    + "  NOW() " + ','
                    + " schedule_at ="
                    + "NULL" +
                    ' WHERE id = ' +

                    "'" + status.Trip_id + "'" +
                    '   ', (error, results, fields) => {

                        if (!error) {
                            console.log(results);
                            return results
                        } else {
                            console.log(error)
                            return error;
                        }

                    });

                connection.end();

            } else if (status.confirm == '1') {
                var connection = mysql.createConnection({
                    host: "127.0.0.1",
                    user: "root",
                    port: 3307,
                    password: "",
                    database: "ailbazco_db"
                })
                connection.connect();

                connection.query('SELECT user_requests.*, users.* ,user_requests.id as tripid  FROM user_requests INNER JOIN users ON user_requests.user_id=users.id where user_requests.id = ?  ', [status.Trip_id], (error, results, fields) => {

                    if (!error) {
                        console.log(results[0]);
                        // return inserts.pus(results);
                        var objj = JSON.stringify(results[0]);
                        objj.Trip_id = status.Trip_id;
                        console.log("data must be coorect", objj)

                        setdatas(objj);
                        return results
                        // res.push(results);

                        //albaz@ail-baz.com
                        //ailbaza156@gmail.com
                        //qlsvblubiwswslky

                    } else {
                        console.log(error)
                        return error;
                        //   inserts.push(results);
                    }

                });

                connection.query('UPDATE user_requests SET schedule_at= NULL ,  updated_at = ?  WHERE id = ? ', [new Date(), status.Trip_id], (error, results, fields) => {

                    if (!error) {

                        return results
                        // res.push(results);

                    } else {
                        console.log(error)
                        return error;

                    }

                });
                connection.end();

            }
        }catch(err1){
            err1.where="Event: comfirm_schedule_trip";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=status;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("-----------------The file was saved--------------------------");
            }); 
        }
    });


    socket.on('delete_request', function (user_id) {
        try{
            console.log("no_drivers_now event data is ", user_id);
            if( Requests['Request' + user_id] !=null  && typeof Requests['Request' + user_id] != undefined ){

            console.log("Trip_id", Requests['Request' + user_id].request.Trip_id);
            var Trip_id = Requests['Request' + user_id].request.Trip_id
            delete Requests['Request' + user_id];

            var connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            });
            connection.connect();


            console.log("'No providers Now'");
            connection.query(' UPDATE user_requests SET   status =  ' +
                '"CANCELLED"' + "," + " updated_at ="
                + "  NOW() " +
                "," + " cancelled_by = " + "'PROVIDER'" +
                "," + " cancel_reason ="
                + "'No providers Now'" +
                ' WHERE id = ' +
                "'" + Trip_id + "'" +
                '   ', (error, results, fields) => {

                    if (!error) {
                        console.log(results);
                        return results
                    } else {
                        console.log(error)
                        return error;
                    }
                    //->bcc(Admin::find(28)->email)
                });
            connection.end();
        }
        }catch(err1){
            err1.where="Event: delete_request";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=user_id;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("------------------------The file was saved---------------------");
            }); 
        }
    });

    socket.on('provider_free', function (providerfreeData) {
        try{
            console.log("provider_free event data is ", providerfreeData);
            console.log("RequestedProviders befor ", RequestedProviders);
            DeleteFromRequestedProvider(providerfreeData.provider_id);
            console.log("RequestedProviders after ", RequestedProviders);
        }catch(err1){
            err1.where="Event: provider_free";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
            err1.data=providerfreeData;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("--------------------The file was saved-----------------------");
            }); 
        }
    });


    socket.on('disconnect', function () {
        try{ 
            //console.log("providers: ",Providers);
            // console.log('disconnect Client', socket.id);

            var tripID=0;
            //var isSearching=false;
            //var inReq;
            for (var clientttt in Clients) {
                if (Clients.hasOwnProperty(clientttt)) {
                    //console.log("one socket client disconnect", Clients[clientttt].socket_id);
                    
                    if (Clients[clientttt].socket_id == socket.id) {
                        console.log('disconnect Client', socket.id);
                        var clientID=Clients[clientttt].Clients_id;
                        console.log("-------------Fonunded ClientID On Disconnect----------------");
                        console.log(clientID);
                        console.log("------------Requests Array-------------");
                        console.log(Requests);
                        console.log("-----------------------");
                        console.log(Requests['Request' + clientID]);
                        if(Requests['Request' + clientID] != undefined){
                            console.log("Found The Request In The Array");
                            tripID = Requests['Request' + clientID].request.Trip_id;
                            console.log("TripID = ",tripID);

                            var connection = mysql.createConnection({
                                host: "localhost",
                                user: "root",
                                port: 3307,
                                password: "",
                                database: "ailbazco_db"
                            });
                
                            connection.connect();

                            async function whole(){
                                function test33(){
                                    return new Promise(function(resolve,reject){
                                        connection.query(' SELECT status FROM user_requests WHERE id = ' + "'" + tripID + "'" ,function (error, results, fields){
                                            if(!error){
                                                if(results[0].status == "SEARCHING"){
                                                    console.log("Status Is Searching");
                                                    //isSearching=true;
                                                    resolve (true);
                                                }
                                                else{
                                                    console.log("Status Is Not Searching");
                                                    console.log("The Result",results[0]);
                                                    resolve (false);
                                                    console.log("status --> ", results[0].status);
                                                }
                                            }
                                            else{
                                                console.log("ERROR in selecting from sql in -deleting from the ram- part to check if it is searching");
                                                return("Errrror");
                                            }
                                        })
                                    })
                                }

                                //console.log(isSearching);
                                var r= await test33();
                                console.log(r);
                                if(r){

                                    connection.query(' UPDATE user_requests SET   status =  ' +
                                        '"CANCELLED"' + "," + " updated_at ="
                                        + "  NOW() " +
                                        "," + " cancelled_by = " + "'system'" +
                                        "," + " cancel_reason ="
                                        + "'" + "..." + "'" +
                                        ' WHERE id = ' +
                                        "'" + tripID + "'" +
                                        '   ', (error, results, fields) => {
                                            if (!error) {
                                                console.log(results);
                                                return results
                                            } else {
                                                console.log(error);
                                                return error;
                                            }
                        
                                    });
                                    console.log("Changed User Close The Ram In DaataBase");
                        
                                    connection.end();
                                    
                                    delete Requests['Request' + clientID];
                        
                                    ////////
                                    delete Clients[clientttt];
                                    console.log("Clients after deleted ", Clients); 
                                    
                                    Clientss[clientID].broadcast.emit('start_not_confirm', { Trip_id: tripID });

                                    if(RequestedProviders.length>0){
                                        //console
                                        deleteTripTuneFromRequestedProviders(0, tripID);
                                    }
                                    else{
                                        console.log("Requested Array =0");
                                    }
                                    console.log(RequestedProviders);

                                }
                            }
                            whole();

                        }
                        
                        else{
                            delete Clients[clientttt];
                            console.log("Clients after deleted ", Clients);   
                        }
                        //deleteTripTuneFromRequestedProviders(1,tripID);
                        console.log("Requested Providrs Array");
                        console.log(RequestedProviders);
                        console.log("---------------");

                        // Clientss[clientID].broadcast.emit('start_not_confirm', { Trip_id: tripID });

                        
                        console.log("----------endOfEvent--Of Cancel By RamOut-------");

                        for(i in clients_sockets){
                            if(clientID == clients_sockets[i].id){
                                console.log(clients_sockets[i].id);
                                clients_sockets.splice(i, 1);
                            }
                        }
                        console.log("clients_sockets ",clients_sockets);
                        console.log("providers_sockets ",providers_sockets);

                    }
                }
            }

            for (var Providerrrrrr in Providers) {
                if (Providers.hasOwnProperty(Providerrrrrr)) {
                    //console.log("one socket provider disconnect", Providers[Providerrrrrr].socket_id);
                    if (Providers[Providerrrrrr].socket_id == socket.id) {
                        console.log('disconnect Provider', socket.id);
                        delete Providers[Providerrrrrr];
                        console.log("Providers after deleted ", Providers);

                        //console.log(Providers[Providerrrrrr]);
                        
                        for(i in providers_sockets){
                            if( socket.id == providers_sockets[i].socket){
                                console.log(providers_sockets[i].id);
                                providers_sockets.splice(i, 1);
                            }
                        }
                        console.log("clients_sockets ",clients_sockets);
                        console.log("providers_sockets ",providers_sockets);
                    }
                }
            }

        }catch(err1){
            err1.where="Event: io.disconnect";
            err1.date=new Date().toLocaleString();
            err1.body=err1.stack;
    
            fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
                if(err) {
                    return console.log(err);
                }

                fs.appendFile("Socket_Errors.txt", "------------------------------------",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
    
                console.log("------------------The file was saved------------------------");
            }); 
        }
    });
});

//Not Worked Function. (Fawzy)
function refechUserLogin(uer_trip_id) {
    console.log("inside refechUserLogin method ");
    var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        port: 3307,
        password: "",
        database: "ailbazco_db"
    });
    connection.connect();

    connection.query("SELECT user_requests.*, users.* ,user_requests.id as tripid    FROM user_requests INNER JOIN users ON user_requests.user_id=users.id where  user_id = ? and schedule_at IS NOT NULL ORDER BY user_requests.id DESC LIMIT 1", [uer_trip_id], function (error, results, fields) {
        if (!error) {
            if (results.length == 0) {
                console.log("result get data from data base  is null");
                setvaluedatescdule(null)
            } else {
                console.log("result get data from data base ", results[0]);
                console.log("current_schedule_trip befor method", results[0].id);
                setvaluedatescdule(results[0].schedule_at.toLocaleString(), results[0].tripid, results[0].s_address_ar, results[0].s_address_en, results[0].d_address_ar, results[0].d_address_en, results[0].mobile, results[0].email, results[0].id);
            }

        } else {
            console.log(error);
            return error;
            //   inserts.push(results);
        };
    });
    connection.end();

}


function cancelFromAllProviders(Trip_id, user_id) {
    console.log("inside cancelFromAllProviders method ");
    var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        port: 3307,
        password: "",
        database: "ailbazco_db"
    });
    connection.connect();


    console.log("'More Than Tow Provider Cancel This Trip'");
    connection.query(' UPDATE user_requests SET   status =  ' +
        '"CANCELLED"' + "," + " updated_at ="
        + "  NOW() " +
        "," + " cancelled_by = " + "'PROVIDER'" +
        "," + " cancel_reason ="
        + "'More Than Tow Provider Cancel This Trip'" +
        ' WHERE id = ' +
        "'" + Trip_id + "'" +
        '   ', (error, results, fields) => {

            if (!error) {
                console.log(results);
                return results
            } else {
                console.log(error)
                return error;
            }
        });
    connection.end();
    console.log("your_trip_is_canceld_from_providers");
    var obj = {
        "first_name": " ",
        "last_name": " ",
        "email": " ",
        "rating": "5",
        "mobile": " ",
        "picture": "",
        "id":""
    }
    var obgpickedUp = {
        response: obj
    }
    delete Requests['Request' + user_id];
    Clientss[user_id].emit('your_trip_is_canceld_from_providers', obgpickedUp);

}


function settripid(data, datas) {
    console.log("settripid methode");
    data.request.rejectedProviders = [];
    data.request.request_id = datas;
    data.request.Trip_id = datas;
    Requests['Request' + data.UserId] = data;
    SendRequest(Requests['Request' + data.UserId]);
}

// function setValues(data) {
//     // console.log(data);
//     requestClient[data.id] = data;
// }

function setvaluedatescdule(data, tripid, s_address_ar, s_address_en, d_address_ar, d_address_en, moboile, email, user_ididid) {

    if (data !== null) {
        /////if data not equal null  (date - schduled at    )
        var scduledate = data;
        var currentdata = new Date().toLocaleString();
        console.log({ scduledate: scduledate, currentdata: currentdata });
        var subcurrentdate = currentdata.substr(0, 9);
        var subscduledate = scduledate.substr(0, 9);
        var subcurrentdatehour = parseInt(currentdata.substr(11, 2));
        var subscduledatehour = parseInt(scduledate.substr(11, 2));
        var subcurrentdatemin = parseInt(currentdata.substr(13, 2));
        var subscduledatemin = parseInt(scduledate.substr(13, 2));
        var subcurrentdateTime = currentdata.substr(19, 3);
        var subscduledateTime = scduledate.substr(19, 3);
        var tirmsubcurrentdateTime = subcurrentdateTime.trim();
        var tirmsubscduledateTime = subscduledateTime.trim();
        console.log([tirmsubcurrentdateTime, tirmsubscduledateTime])
        var strlengthsubcurrentdatehour = subcurrentdatehour.toString();
        var strlengthsubscduledatehour = subscduledatehour.toString();
        if (tirmsubcurrentdateTime == 'PM' && tirmsubscduledateTime == 'PM' || tirmsubcurrentdateTime == 'AM' && tirmsubscduledateTime == 'AM') {
            if (subcurrentdatehour == 12) {
                subcurrentdatehour = 0;
            }
            if (subscduledatehour == 12) {
                subscduledatehour = 0;
            }
        } else if (tirmsubcurrentdateTime == 'PM' && tirmsubscduledateTime == 'AM' || tirmsubcurrentdateTime == 'AM' && tirmsubscduledateTime == 'BM') {
            if (tirmsubcurrentdateTime == 'PM' && tirmsubscduledateTime == 'AM') {
                if (strlengthsubcurrentdatehour.length == 2 && strlengthsubscduledatehour.length == 1) {
                    subscduledatehour += 12;
                } else if (strlengthsubcurrentdatehour.length == 1 && strlengthsubscduledatehour.length == 2) {
                    subcurrentdatehour += 12;
                }
            } else if (tirmsubcurrentdateTime == 'AM' && tirmsubscduledateTime == 'BM') {
                if (strlengthsubcurrentdatehour.length == 2 && strlengthsubscduledatehour.length == 1) {
                    subscduledatehour += 12;
                } else if (strlengthsubcurrentdatehour.length == 1 && strlengthsubscduledatehour.length == 2) {
                    subcurrentdatehour += 12;
                }
            }
        }

        console.log([{ subscduledatehour: subscduledatehour }, { subscduledatehour: subscduledatehour }])

        if (subcurrentdate === subscduledate) {
            if (subcurrentdatehour + 1 == subscduledatehour) {
                var date = scduledate.toLocaleString().substr(0, 9)
                var time = scduledate.toLocaleString().substr(10, 11);
                var obj = {

                    schedule: {
                        Trip_id: tripid,
                        schedule_date: date,
                        schedule_time: time,
                        s_address_ar: s_address_ar,
                        d_address_ar: d_address_ar,
                        s_address_en: s_address_en,
                        d_address_en: d_address_en
                    },
                    request: {
                        moboile: moboile,
                        email: email
                    }
                }

                console.log("current_schedule_trip", user_ididid);
                Clientss[user_ididid].emit('current_schedule_trip', obj);
            }
        }
    }
}

function setdatas(data) {
    var datas = JSON.parse(data);
    var datasrequest = {
        s_latitude: datas.s_latitude,
        s_longitude: datas.s_longitude,
        d_latitude: datas.d_latitude,
        d_longitude: datas.d_longitude,
        first_name: datas.first_name,
        last_name: datas.last_name,
        email: datas.email,
        picture: datas.picture,
        rating: datas.rating,
        mobile: datas.mobile,
        status: datas.status,
        booking_id: datas.booking_id,
        s_address_ar: datas.s_address_ar,
        d_address_ar: datas.d_address_ar,
        s_address_en: datas.s_address_en,
        d_address_en: datas.d_address_en,
        id: datas.id,
        service_type: datas.service_type_id,
        distance: datas.distance,
        schedule_date: datas.schedule_date,
        schedule_time: datas.schedule_time,
        use_wallet: datas.use_wallet,
        payment_mode: datas.payment_mode,
        request_id: datas.tripid,
        Trip_id: datas.tripid,
        rejectedProviders: []
    }

    var datarequest = { request: datasrequest }
    requestScduleTrip = datarequest;
    requestScduleTrip.UserId = datas.id;
    console.log("salmonila");
    console.log(requestScduleTrip);
    Requests['Request' + datas.id] = requestScduleTrip;

    SendRequest(Requests['Request' + datas.id]);

}


function SendRequest(Data) {

    ProvidersTripTune[Data.request.Trip_id.toString()] = [];
    // console.log("new requist RequestedProviders RequestedProviders are", RequestedProviders);
    // console.log("new requist rejectedProviders are", Data.request.rejectedProviders);
    for (var Provider in Providers) {

        if (RequestedProviders.indexOf(Provider) <= -1 && Data.request.rejectedProviders.indexOf(Provider) <= -1 && Data.request.rejectedProviders.includes(parseInt(Provider)) == false) {
            var requestLatitude = Data.request.s_latitude,
                requestLongitude = Data.request.s_longitude,
                providerLatitude = Providers[Provider].lat,
                providerLongitude = Providers[Provider].long,
                provider_service = Providers[Provider].provider_service,
                providerRange = Providers[Provider].range;

            if (getDistanceFromLatLonIMm(providerLatitude, providerLongitude, requestLatitude, requestLongitude) <= providerRange && Data.request.service_type == provider_service) {
                //  console.log("send request to this provider",Data);
                emitOn(io, 'request_range', Data, Providers[Provider].socket_id);
                RequestedProviders.push(Provider);
                ProvidersTripTune[Data.request.Trip_id.toString()].push(Provider);
            }
            else {
                console.log("provider not match distance or service");
            }
        }
        else {
            console.log("provider not match RequestedProviders or rejected ");
            console.log("Aloo From Send Request Function");

            console.log("Requested Provider");
            console.log(RequestedProviders);
            console.log("Rejected Array");
            console.log(Data.request.rejectedProviders);
        }
    }
    // console.log("ProvidersTripTune are ", ProvidersTripTune);
}

function DeleteFromRequestedProvider(Provider) {
    // try{
    // console.log("----Try-------");
    // throw new Error('Error Occurred'); 

    if (RequestedProviders.indexOf(Provider) > -1) {
        RequestedProviders.splice(RequestedProviders.indexOf(Provider), 1);
        console.log("Delete Done");
    }
    // }catch(err1){
    //     err1.where="Function: DeleteFromRequestedProvider";
    //     err1.date=new Date().toLocaleString();
    //     err1.body=err1.stack;

    //     fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
    //         if(err) {
    //             return console.log(err);
    //         }

    //         fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
    //             if(err) {
    //                 return console.log(err);
    //             }
    //         });

    //         console.log("The file was saved!");
    //     }); 
    // }
}

//Why He Delete It If It Not Equal Provider's ID. (Fawzy)
function deleteTripTuneFromRequestedProviders(provider_id, Trip_id) {

    // try{
    //     console.log("----Try-------");
    //     throw new Error('Error Occurred'); 

    // console.log("RequestedProviders befor tune delateng", RequestedProviders);

    console.log("Requested Provider");
    console.log(RequestedProviders);

    //
    if(RequestedProviders.length == 0 || ProvidersTripTune.length ==0 ){
        console.log("RequestedProviders = 0")
    }
    //
    else{
        console.log(ProvidersTripTune);
        console.log("Delete Funciton");
        for (var i = 0; i < ProvidersTripTune[Trip_id].length; i++) {

            if (ProvidersTripTune[Trip_id][i] !== provider_id) {
                DeleteFromRequestedProvider(ProvidersTripTune[Trip_id][i]);
            }
        }

        //delete ProvidersTripTune[Trip_id];
        //// console.log("RequestedProviders after tune delateng", RequestedProviders);
    }
    delete ProvidersTripTune[Trip_id];
//    }catch(err1){
//         err1.where="Function: deleteTripTuneFromRequestedProviders";
//         err1.date=new Date().toLocaleString();
//         err1.body=err1.stack;

//         fs.appendFile("Socket_Errors.txt", JSON.stringify(err1), function(err) {
//             if(err) {
//                 return console.log(err);
//             }

//             fs.appendFile("Socket_Errors.txt", "\r\n",function(err) {
//                 if(err) {
//                     return console.log(err);
//                 }
//             });

//             console.log("The file was saved!");
//         }); 
//     }
}


function providerCancelTripAndAddTripCostFromUserToProvider(provider_id,Trip_id,client_id,serviceType) {

    console.log("cancelTripAndAddTripCostFromUserToProvider method", Trip_id);

    request.post(
        'http://5.189.186.251/ailbaz_server/public/api/provider/user_tax',
        {
            json: {
                "Trip_id": Trip_id
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {

                if (typeof response.body != undefined) {
                 
                   console.log("send event to provider_cancel_trip_after_waiting",response.body);

                   console.log("providerID--",provider_id);
                   //console.log(Providerss[provider_id]);

                    Providerss[provider_id].emit('provider_cancel_trip_after_waiting', { Trip_id:Trip_id, provider_email: "admin@ali.com" });
                    

                    console.log("Clientss[client_id]",client_id);

                    // var obj = {
                    //     "first_name": " ",
                    //         "last_name": " ",
                    //         "email": " ",
                    //         "rating": "5",
                    //         "mobile": " ",
                    //         "picture": "",
                    //         "id":""
                    // }

                    var obj = {
                        "Event":""
                    }

                    var obgpickedUp = {
                        response: obj
                    }

                    console.log("send to client the driver cancel after wate ");
                    Clientss[client_id].emit('provider_cancel_trip_after_waiting', obgpickedUp);
                }
            }
        }
    );

    var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        port: 3307,
        password: "",
        database: "ailbazco_db"
    });
    connection.connect();


    // console.log("'Cancel This Trip After Wating'");
    connection.query(' UPDATE user_requests SET   status =  ' +
        '"CANCELLED"' + "," + " updated_at ="
        + "  NOW() " +
        "," + " cancelled_by = " + "'PROVIDER'" +
        "," + " cancel_reason ="
        + "'Provider Cancel This Trip After Wating'" +
        ' WHERE id = ' +
        "'" + Trip_id + "'" +
        '   ', (error, results, fields) => {

            if (!error) {
                console.log(results);
                return results
            } else {
                console.log(error)
                return error;
            }
        });
    connection.end();

    /////////////////

    async function asyncToServiceType(){
        var connection = mysql.createConnection({
            host: "localhost",
            user: "root",
            port: 3307,
            password: "",
            database: "ailbazco_db"
        });
        connection.connect();

        function gettingFixed(){
            return new Promise(function(resolve, reject){
                connection.query(' SELECT fixed FROM service_types WHERE id = ' + "'" + serviceType + "'" ,function (error, results, fields){
                    if(!error){
                        resolve([results[0].fixed]);
                    }
                })
            })
        }
        var arr=await gettingFixed();
        var fixed=arr[0];
        console.log("Fixed-->",fixed);

        let current_datetime = new Date()
        let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds()
        console.log("---Before Database---");
        //created_at,use_wallet,distance     +      "'" + data.request.use_wallet + "',"   +  
        connection.query("INSERT INTO user_request_payments(created_at,request_id,fixed,total) VALUES (" + "'" + formatted_date + "'," + "'" + Trip_id + "'," + "'" + fixed + "'," + "'" + fixed + "')", function (error, results, fields) {
            if (!error) {
                console.log("insert request in user_request_payments dataBase ", results.insertId);
                //settripid(data, results.insertId);
                return results

            } else {
                console.log(error);

                return error;
            };
        });
        console.log("---After Database---");
        connection.end();
    }
    asyncToServiceType();

    ///////////////////

}

function userCancelPutProviderNotArrived(datas){

    console.log("userCancelPutProviderNotArrived method",datas.Trip_id);
    console.log("userCancelPutProviderNotArrived method");

    ///////////////////////////////////////////
    request.post(
        'http://5.189.186.251/ailbaz_server/public/api/provider/user_tax2',
        {
            json: {
                "Trip_id": datas.Trip_id
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {

                if (typeof response.body != undefined) {
                 
                   console.log("response in userCancelPutProviderNotArrived method",response.body);
                   
                }
            }
        }
    );
    ///////////////////////////////////////////

    var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        port: 3307,
        password: "",
        database: "ailbazco_db"
    });
    connection.connect();
    // reason
    connection.query(' UPDATE user_requests SET   status =  ' +
        '"CANCELLED"' + "," + " updated_at ="
        + "  NOW() " +
        "," + " cancelled_by = " + "'USER'" +
        "," + " cancel_reason ="
        + "'" + datas.reason + "'" +
        ' WHERE id = ' +
        "'" + datas.Trip_id + "'" +
        '   ', (error, results, fields) => {

            if (!error) {
                console.log(results);
                return results
            } else {
                console.log(error)
                return error;
            }

        });
    connection.end();
    delete Requests['Request' + datas.client_id];
    if (datas.provider_id != '0' && datas.provider_id != '' && datas.Trip_id !='') {
        Providerss[datas.provider_id].emit('cancel_trip_provider', { Trip_id: datas.Trip_id, provider_email: "admin@ali.com" });
    }
}

function usercCancelTripAndAddTripCostFromUserToProvider(provider_id,Trip_id,client_id,reason) {

    console.log("usercCancelTripAndAddTripCostFromUserToProvider method", Trip_id);

    request.post(
        'http://5.189.186.251/ailbaz_server/public/api/provider/user_tax',
        {
            json: {
                "Trip_id": Trip_id
            }
        },
        
        function (error, response, body) {
            if (!error && response.statusCode == 200) {

                if (typeof response.body != undefined) {
                 
                    Providerss[provider_id].emit('user_cancel_trip_after_waiting', { Trip_id:Trip_id, provider_email: "admin@ali.com" });
                    console.log("Clientss[client_id]",client_id);
                    var obj = {
                        "first_name": " ",
                            "last_name": " ",
                            "email": " ",
                            "rating": "5",
                            "mobile": " ",
                            "picture": "",
                            "id":""
                         
                    }
                    var obgpickedUp = {
                        response: obj
                    }
                    console.log("send to client the client cancel after wate  and deduce cost from client",obgpickedUp);
                    Clientss[client_id].emit('user_cancel_trip_after_waiting', obgpickedUp);
                }
            }
        }
    );

    console.log("After The Post To The Server");

    var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        port: 3307,
        password: "",
        database: "ailbazco_db"
    });
    connection.connect();


    // console.log("' user Cancel This Trip After Wating'");

    connection.query(' UPDATE user_requests SET   status =  ' +
        '"CANCELLED"' + "," + " updated_at ="
        + "  NOW() " +
        "," + " cancelled_by = " + "'USER'" +
        "," + " cancel_reason ="
        + "'"+reason+"'" +
        ' WHERE id = ' +
        "'" + Trip_id + "'" +
        '   ', (error, results, fields) => {

            if (!error) {
                console.log(results);
                return results
            } else {
                console.log(error)
                return error;
            }
        });
    connection.end();
}

function emitOn(io, room, data, to) {
    if (to) {
        io.to(to).emit(room, data);
    } else {
        io.emit(room, data);
    }
}

function getDistanceFromLatLonIMm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
