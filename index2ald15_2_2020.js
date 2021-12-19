var express = require("express"); //// run the server on the express 
var socket = require("socket.io");   ///// require socket.io 
var mysql = require("mysql");////connect to my sqli 
var found = 0;
var uuid = require('uuid/v4')


/*

// emad
---recived
found   
accept  
arrived    
pickup
dropped 
dropp
paid   
confirmpaid   
scdule_trip   
confirm_scdule_trip
////////////////////////////////////////////
 ----send
 request_range
 cancel_trip_user
 scdule_trip
 delete_request
 confirm_scdule_trip

*/

// App Setup
var port = process.env.port || 3000
var app = express()
var server = app.listen(port ,  ()=>console.log(`the app is listining to port  ${port}`))



// var app = express();
// var server = app.listen(3000,function(){
//     console.log('Listening to requests on port 3000');
//     var id =0;
// console.log();


// });
// app.set('port', process.env.PORT || 3000);
// app.set('views', path.join(__dirname, 'views/index'));


// Static Files
app.use(express.static('public'));   ///// move to puplic folder (chat app) 


// Static Files
var io = socket(server);  ///// include the server inside the socket 
var Clients = {};
var Providers = {};
var RequestedProviders = [];
var Requests = {};
var AcceptedRequests = []
var Ignore = 0;
var provider_id = 0;

var res = [];
var arriveDate = "";
var pickupDate = "";
var dropDate = "";
var providerIdArr = [];

var requestClient =[];
var servicestype = [];
var requestId = 0;
var tripid = 0;
var requestScduleTrip = '' ;
var provider_email = "";
var Clients_id = 3;
var  ClientsIdArr = [];
var Providerss = {};
var Clientss = {};
var s_lat = 0;
var  s_long = 0;
var d_lat = 0;
var d_long = 0;
io.on('connection',function(socket){       ////// connection add eventlistner 
console.log('connection' , socket.id);


    var UserLat = socket.handshake.query.lat;
    var UserLong = socket.handshake.query.long;
    var UserType = socket.handshake.query.type;
    var UserId = socket.handshake.query.id;
    //var UserId = 66;
   
   // if(ClientsIdArr[0] == data.request.id){
    if(UserType == 'Clients'){

        console.log('userType is Clients  ' , socket.id); 
        console.log('user Clients id' , UserId);
        Clients[UserId] = { "socket_id": socket.id, "lat": UserLat ,"long": UserLong,Clients_id:UserId};
        console.log('users' , Clients);
        Clientss[UserId] = socket;
////////////connect to batabase /////////////////////////////////////////////



var connection = mysql.createConnection({
            host:"localhost",
            user:"root",
            password:"",
            database:"ailbazco_db"
        });
        connection.connect();


        connection.query("SELECT user_requests.*, users.* ,user_requests.id as tripid    FROM user_requests INNER JOIN users ON user_requests.user_id=users.id where  user_id = ? and schedule_at IS NOT NULL ORDER BY user_requests.id DESC LIMIT 1",[UserId],function(error,results,fields){
            if(!error){
                if( results.length == 0){
                    console.log("result get data from data base  is null");
                    setvaluedatescdule(null)
                }else{
                    console.log("result get data from data base ",results[0]);
                    setvaluedatescdule(results[0].schedule_at.toLocaleString(),results[0].tripid,results[0].s_address_ar,results[0].s_address_en,results[0].d_address_ar,results[0].d_address_en,results[0].mobile,results[0].email);
                }

            }else{
                console.log(error);
                return  error;
                //   inserts.push(results);
            };
        });
        connection.end();

      function  setvaluedatescdule(data,tripid,s_address_ar,s_address_en,d_address_ar,d_address_en,moboile,email){

          if(data !== null){       
              /////if data not equal null  (date - schduled at    )
              var scduledate= data;
              var currentdata = new Date().toLocaleString();
              console.log({scduledate:scduledate,currentdata:currentdata});
              var subcurrentdate =   currentdata.substr(0,9);
              var subscduledate =  scduledate.substr(0,9);

              var subcurrentdatehour =  parseInt(currentdata.substr(11,2));
              var subscduledatehour = parseInt(scduledate.substr(11,2));

              var subcurrentdatemin =  parseInt(currentdata.substr(13,2));
              var subscduledatemin = parseInt(scduledate.substr(13,2));
              var subcurrentdateTime =  currentdata.substr(19,3);
              var subscduledateTime = scduledate.substr(19,3);
               var tirmsubcurrentdateTime = subcurrentdateTime.trim();
               var tirmsubscduledateTime = subscduledateTime.trim();
              console.log([tirmsubcurrentdateTime,tirmsubscduledateTime])
              var strlengthsubcurrentdatehour = subcurrentdatehour.toString();
              var strlengthsubscduledatehour = subscduledatehour.toString();
          if( tirmsubcurrentdateTime == 'PM' && tirmsubscduledateTime == 'PM' || tirmsubcurrentdateTime == 'AM' && tirmsubscduledateTime == 'AM'  ){
              if(subcurrentdatehour == 12  ){
                  subcurrentdatehour = 0;
              }

              if(subscduledatehour == 12  ){
                  subscduledatehour = 0;
              }
          }else if(tirmsubcurrentdateTime == 'PM' && tirmsubscduledateTime == 'AM' || tirmsubcurrentdateTime == 'AM' && tirmsubscduledateTime == 'BM'){
                  if(tirmsubcurrentdateTime == 'PM' && tirmsubscduledateTime == 'AM'){
                      if(strlengthsubcurrentdatehour.length ==2 && strlengthsubscduledatehour.length == 1 ){
                          subscduledatehour += 12;
                      }else if(strlengthsubcurrentdatehour.length ==1 && strlengthsubscduledatehour.length == 2){
                          subcurrentdatehour +=12;
                      }
                  }else if(tirmsubcurrentdateTime == 'AM' && tirmsubscduledateTime == 'BM'){
                      if(strlengthsubcurrentdatehour.length ==2 && strlengthsubscduledatehour.length == 1 ){
                          subscduledatehour += 12;
                      }else if(strlengthsubcurrentdatehour.length ==1 && strlengthsubscduledatehour.length == 2){
                          subcurrentdatehour +=12;
                      }
                  }
          }

              console.log([{subscduledatehour:subscduledatehour},{subscduledatehour:subscduledatehour}])
              if(subcurrentdate === subscduledate){
                  if(subcurrentdatehour+1 >= subscduledatehour ){
                      
                      var date =   scduledate.toLocaleString().substr(0,9)
                      var time = scduledate.toLocaleString().substr(10,11);
                      var obj = {
                          schedule :{
                              schedule_date:date,
                              schedule_time:time,
                              s_address_ar:s_address_ar,
                              d_address_ar:d_address_ar,
                              s_address_en:s_address_en,
                              d_address_en:d_address_en
                          },
                          request:{
                              moboile:moboile,
                              email:email
                          }
                      }

                      io.emit('schedule_trip',obj);

                      socket.on('confirm_schedule_trip',function (status) {
                        console.log("confirm_schedule_trip event");
                         
                          if (status.confirm == '0') {

/////connect to my sqli 
                              var connection = mysql.createConnection({
                                  host: "127.0.0.1",
                                  user: "root",
                                  password: "",
                                  database: "ailbazco_db"
                              })
                              connection.connect();
                              connection.query(' UPDATE user_requests SET   status =  ' +
                                  '"CANCELLED"' + "," + " updated_at ="
                                  + "  NOW() " +','
                                  + " schedule_at ="
                                  + "NULL" +
                                  ' WHERE id = ' +

                                  "'" + tripid + "'" +
                                  '   ', (error, results, fields) => {

                                  if (!error) {
                                      console.log(results);
                                      // return inserts.push(results)

                                      return results
                                      // res.push(results);

                                  } else {
                                      console.log(error)
                                      return error;

                                      //   inserts.push(results);


                                  }


                              });

                              connection.end();
                              obj.schedule.message = "the trip is canceled";
                              io.emit('confirm_schedule_trip', obj);

                          }else if(status.confirm == '1'){
                              var connection = mysql.createConnection({
                                  host: "127.0.0.1",
                                  user: "root",
                                  password: "",
                                  database: "ailbazco_db"
                              })

                              connection.connect();


                              connection.query('SELECT user_requests.*, users.*  FROM user_requests INNER JOIN users ON user_requests.user_id=users.id where user_requests.id = ?  ',[tripid], (error, results, fields) => {

                                  if (!error) {
                                      console.log(results[0]);
                                      // return inserts.pus(results)
                                      setdatas(JSON.stringify(results[0]))

                                      return results
                                      // res.push(results);

                                  } else {
                                      console.log(error)
                                      return error;

                                      //   inserts.push(results);


                                  }


                              });


                              connection.query('UPDATE user_requests SET schedule_at= NULL ,  updated_at = ?  WHERE id = ? ',[new Date(),tripid], (error, results, fields) => {

                                  if (!error) {

                                      return results
                                      // res.push(results);

                                  } else {
                                      console.log(error)
                                      return error;

                                      //   inserts.push(results);


                                  }


                              });





                              connection.end();

                             function  setdatas(data){
                             console.log(JSON.parse(data));
                          var   datas = JSON.parse(data);

                                 var   datasrequest = {
                                     s_latitude: datas.s_latitude,
                                     s_longitude: datas.s_longitude,
                                     d_latitude:  datas.d_latitude,
                                     d_longitude: datas.d_longitude,
                                     first_name: datas.first_name,
                                     last_name: datas.last_name,
                                     email: datas.email,
                                     picture: datas.picture,
                                     rating: '5.00',
                                     mobile: datas.mobile,
                                     status: datas.status,
                                     booking_id: datas.booking_id,
                                     s_address_ar: datas.s_address_ar,
                                     d_address_ar: datas.d_address_ar,
                                     s_address_en: datas.s_address_en,
                                     d_address_en: datas.d_address_en,
                                     id: UserId,
                                     service_type:  datas.service_type_id,
                                     distance: datas.distance,
                                     schedule_date: datas.schedule_date,
                                     schedule_time: datas.schedule_time,
                                     use_wallet: 0,
                                     payment_mode: datas.payment_mode,
                                     request_id: tripid,
                                     rejectedProviders: []
                                 }


                              var datarequest = {request:datasrequest}
                                 requestScduleTrip = datarequest;
                                     datarequest.UserId = UserId;
                             console.log("salmonila");
                             console.log(datarequest);
                                 Requests['Request'+UserId] = datarequest;

                                 SendRequest(Requests['Request'+UserId]);

                                 io.emit(data);

                                     }
                              obj.schedule.message = "the trip is is accepted";

                              io.emit('confirm_schedule_trip', obj);

                          }


                      })

                  }
              }
          }
        }

// console.log(Clients);
        socket.on('schedule_trip',function (data) {
            console.log("schedule_trip event");
            console.log({dateeeeee:data})
            var strdatescdule = data.schedule_date.toString();
            var strtimeschdule  = data.schedule_time.toString();

           // console.log("DSsd");
           // function reverseString(strdatescdule) {
                var splitString = strdatescdule.split('-');
                var reverseArray = splitString.reverse();
                var joinArray = reverseArray.join("-");

            var dateSchedule = joinArray +" "+ strtimeschdule;


            var connection = mysql.createConnection({
                host:"localhost",
                user:"root",
                password:"",
                database:"ailbazco_db"
            })

            connection.connect();

            connection.query("SELECT schedule_at  FROM user_requests WHERE user_id = ? and schedule_at IS NOT NULL",[data.id],function(error,results,fields){
                if(!error){

                    if( results.length == 0){
                        ifCondetionScdule(null)
                    }else{
                        ifCondetionScdule(results[0].schedule_at);

                    }

                    return results
                    // res.push(results);

                }else{
                    console.log(error);
                    return  error;

                    //   inserts.push(results);

                };

            });

            connection.end();

            function ifCondetionScdule(datas){
                console.log(datas);
                if(datas == null){
                    console.log({servicetype:data})
                    var connection = mysql.createConnection({
                        host:"localhost",
                        user:"root",
                        password:"",
                        database:"ailbazco_db"
                    })

                    connection.connect();
                    connection.query("INSERT INTO"  +
                        " user_requests("+
                        " schedule_at,"+
                        " booking_id,"+
                        "user_id,"+
                        "current_provider_id,"+
                        "service_type_id,"+
                        "status,"+
                        "payment_mode,"+
                        "distance,"+
                        "s_address_ar,"+
                        "s_address_en,"+
                        "s_latitude,"+
                        "s_longitude,"+
                        "d_address_ar,"+
                        "d_address_en,"+
                        "d_latitude,"+
                        "d_longitude"+

                        ") VALUES ("+
                        "'"+ dateSchedule+"'"+","+
                        "'"+ data.booking_id+"'"+","+
                        "'"+ data.id+"'"+","+
                        "'"+ data.id+"'"+","+

                        "'" + data.service_type+"'"+","+
                        "'SCHEDULED'"+","+
                        "'"+ data.payment_mode+"'"+","+
                        "'"+ data.distance+"'"+","+
                        "'"+ data.s_address_ar+"'"+","+
                        "'"+ data.s_address_en+"'"+","+
                        ""+ data.s_latitude+""+","+
                        ""+ data.s_longitude+""+","+
                        "'"+ data.d_address_ar+"'"+","+
                        "'"+ data.d_address_en+"'"+","+
                        ""+ data.d_latitude +""+","+
                        ""+ data.d_longitude+")",(error,results,fields)=>{
                        if(!error){


                            refechUserLogin(data.id);

                            console.log(results);
                            // return inserts.push(results)
                            return results
                            // res.push(results);

                        }else{
                            console.log(error);
                            return  error;

                            //   inserts.push(results);


                        };

                    });

                    connection.end();

                    checkescduletrip("done",data)
                }else{
                    checkescduletrip("false",data)
                }
            }

function checkescduletrip(data,datas) {
                console.log({datas:datas})
                var obj = "";
if(data == 'done'){
obj ={
    schedule :{
        schedule_date:datas.schedule_date,
        schedule_time:datas.schedule_time,
        message : "is done"
    },request:{
        datas
    }
};
    io.emit('confirm_schedule_trip',obj);
}else{
  var  obj =
        {
            schedule :{
                schedule_date:datas.schedule_date,
                schedule_time:datas.schedule_time,
                message : "is dont save"
            },request:{
                datas
            }
        };

          io.emit('confirm_schedule_trip',obj);

}
}


        })
    
        function refechUserLogin(uer_trip_id){
            console.log("inside refechUserLogin method ");
                    var connection = mysql.createConnection({
                        host:"localhost",
                        user:"root",
                        password:"",
                        database:"ailbazco_db"
                    });
                    connection.connect();


                    connection.query("SELECT user_requests.*, users.* ,user_requests.id as tripid    FROM user_requests INNER JOIN users ON user_requests.user_id=users.id where  user_id = ? and schedule_at IS NOT NULL ORDER BY user_requests.id DESC LIMIT 1",[uer_trip_id],function(error,results,fields){
                        if(!error){
                            if( results.length == 0){
                                console.log("result get data from data base  is null");
                                setvaluedatescdule(null)
                            }else{
                                console.log("result get data from data base ",results[0]);
                                setvaluedatescdule(results[0].schedule_at.toLocaleString(),results[0].tripid,results[0].s_address_ar,results[0].s_address_en,results[0].d_address_ar,results[0].d_address_en,results[0].mobile,results[0].email);
                            }

                        }else{
                            console.log(error);
                            return  error;
                            //   inserts.push(results);
                        };
                    });
                    connection.end();

        }

    
    
    }else{
        console.log('userType is provider ' , socket.id); 
        console.log("user provider id", UserId);
    
    //     var   datasrequest = {
    //         s_latitude: '29.9631341',
    //         s_longitude: '30.9193783',
    //         d_latitude: '29.980650573505677',
    //         d_longitude: '30.929078869521618',
    //         first_name: 'Fred',
    //         last_name: 'Fred',
    //         email: 'faridfathy94@yahoo.com',
    //         picture: 'http://192.168.1.111/ailbaz_server/storage/app/public/null',
    //         rating: '5.00',
    //         mobile: '01234567891',
    //         status: 'SEARCHING',
    //         booking_id: '',
    //         s_address_ar: '76 No. 8, First 6th of October, Giza Governorate, Egypt',
    //         d_address_ar: '131 Gamal Abd El-Nasir, Al Giza Desert, Giza Governorate, Egypt,null,Giza Governorate',
    //         id: '3',
    //         service_type: '5',
    //         distance: '4039',
    //         schedule_date: '',
    //         schedule_time: '',
    //         use_wallet: 0,
    //         payment_mode: 'CASH',
    //         request_id: 1,
    //         rejectedProviders: [],
    //         Trip_id: 10,
    //
    //
    // }
    //
    //
    //     var datarequest = {request:datasrequest}
    //     requestScduleTrip = datarequest;
    //     datarequest.UserId = 3;
    //     console.log("salmonila");
    //     console.log(datarequest);
    //     Requests['Request'+UserId] = datarequest;

        Providers[UserId] = { "socket_id": socket.id, "lat": UserLat ,"long": UserLong ,"provider_id":UserId,
            "range":socket.handshake.query.range};
        Providerss[UserId] = socket;
        //Requests[Request] = Providers;
        
         console.log('Providers' , Providers);
        if(Object.size(Requests) > 0){
            for (var Request in Requests) {
                SendRequest(Requests[Request]);
                console.log({sososo:Requests});
                console.log("sososo",{sososo:Requests});
            } 
        }
    }


    // request_range event 

    socket.on('request_range', function(data){
        
        if(UserType == 'Clients' ){
                            console.log("request_range event clients" );
                            console.log("data event request range",data);
                // console.log({datassssssssssss:ClientsIdArr});
                    setValues(data.request);

                    function setValues(data){
                        requestClient = data;
                    }

                    var connection = mysql.createConnection({
                        host:"localhost",
                        user:"root",
                        password:"",
                        database:"ailbazco_db"
                    })
                    connection.connect();

                    let current_datetime = new Date()
                    let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds() 
                    
                    connection.query("INSERT INTO user_requests(created_at,distance) VALUES ("+ "'"+formatted_date+"',"+"'"+data.request.distance+"')",function(error,results,fields){
                        if(!error){
                        
                            // return inserts.push(results)
                            console.log("insert request in data base  and this is trib id",results.insertId);
                            settripid(results.insertId);
                            return results
                            // res.push(results);
                        }else{
                            console.log(error);
                            console.log("null");
                            return  error;
                            //   inserts.push(results);
                        };
                    });
                    connection.end();
                    //res.push(query("SELECT id FROM user_requests ORDER BY id DESC LIMIT 1"));

                    

                    function settripid(datas) {
                        tripid = datas;
                        data.request.rejectedProviders = [];
                        data.request.Trip_id = tripid;
                        Requests['Request'+UserId] = data;

                        SendRequest(Requests['Request'+UserId]);
                // console.log({Requestsssss:Requests});
                // 			//var m = Object.size(Requests);
                // 			//console.lozg('NEW REQUEST '+ Object.size(Request s) );
                //
                // console.log("io.emit(data)  data",data )
                //         io.emit(data);
                    }

                    socket.on('cancel_trip_user',function (datas) {
                        // Tri
                        console.log(" cancel event from user ",datas);

                        console.log({cancel_trip_userssssssssss:datas});

                        var connection = mysql.createConnection({
                            host:"127.0.0.1",
                            user:"root",
                            password:"",
                            database:"ailbazco_db"
                        })

                        connection.connect();

// reason
                        connection.query(' UPDATE user_requests SET   status =  ' +
                            '"CANCELLED"' +","+" updated_at ="
                            +"  NOW() "  +

                            ","+" cancelled_by = "+"'USER'"  +
                            
                            ","+" cancel_reason ="
                            + "'"+datas.reason +"'"+

                            ' WHERE id = ' +

                            "'"+ tripid+"'"+
                            '   ',(error,results,fields)=>{

                            if(!error){
                                console.log(results);
                                // return inserts.push(results)

                                return results
                                // res.push(results);

                            }else{
                                console.log(error)
                                return  error;

                                //   inserts.push(results);
                            }

                        });

                        connection.end();

                        // console.log({data:data}); new edit emad 15/2/2020
                        io.emit("cancel_trip_provider",{Trip_id:tripid,provider_email:"admin@ali.com"});
                    //    if(data.response.id){
                    //        console.log("send this trip is canceld to provider")
                    //     Providerss[data.response.id].emit("cancel_trip_provider", data);
                    //    }
                       
                       

                    })
        }else{
                        console.log("request_range event provider" );
                        console.log("im provider provider id "+ data.request.id);

                        // Object.keys(Clients).forEach(function(key) {
                        //
                        //     var keyint =  parseInt(key);
                        //     Clients_id = keyint;
                        //     ClientsIdArr.push(Clients_id);
                        //
                        //
                        //
                        // });
                        if(data.Status == 'Reject'){

                            DeleteFromRequestedProvider(UserId);
                        // Requests['Request'+data.request.id].request.rejectedProviders.push(UserId);
                        }
                        else if(data.Status == 'Ignore'){

                            /*if(Ignore < 1){
                                Ignore+=1;
                                DeleteFromRequestedProvider(UserId);
                                SendRequest(Requests['Request'+data.request.id])
                            }*/
                        }
                        else if(data.Status == 'Accept' && Requests['Request'+data.request.id] != null  ){
                        //   io.emit('not_confirm', {Trip_id:tripid});
                        //    console.log({tripid:data.request.Trip_id})
                        //    tripid = data.request.Trip_id;
                        //    console.log({tripidssssssssss:tripid});

                            Providerss[data.response.id].broadcast.emit('not_confirm', {Trip_id:data.request.Trip_id});

                            Object.keys(Providers).forEach(function(key) {
                                var keyint =  parseInt(key);
                                provider_id = keyint;
                                providerIdArr.push(provider_id);
                                console.log("providerIdArr", providerIdArr[0]);
                            });

                            data.request.Trip_id = tripid;

                        //   data.request.provider_email =
                            provider_email =  data.response.email;
                        //  io.emit("accept_provider",{tripid:tripid,provider_email:provider_email});
                            // console.log("providesr", {Providers:Providers});

                        if(requestScduleTrip != ''){
                            tripid =  requestScduleTrip.request.request_id
                            requestClient = requestScduleTrip.request;
                        }

                            // Object.keys(Providers).forEach(function(key) {
                            //     var keyint =  parseInt(key);
                            //     provider_id += keyint
                            //
                            // });

                            var connection = mysql.createConnection({
                                host:"localhost",
                                user:"root",
                                password:"",
                                database:"ailbazco_db"
                            })

                            connection.connect();

                            
                             console.log(' all data to update ',data);

                            connection.query("UPDATE user_requests SET " +
                                "booking_id=0,user_id=?,provider_id=?," +
                                "current_provider_id=?,service_type_id=?,status=?," +

                                "s_address_ar=?,s_address_en=?,s_latitude=?,s_longitude=?," +
                                "d_address_ar=?,d_address_en=?,d_latitude=?,d_longitude=?," +
                                "updated_at=? WHERE id = ?",[
                                data.request.id,data.response.id,
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
                                tripid],function(error,results,fields){
                                if(!error){
                                    // console.log(results.insertId);
                                    // return inserts.push(results)
                                    console.log("data has been updated",results);
                                  
                                    // console.log({results:results});

                                    return results
                                    // res.push(results);

                                }else{
                                    console.log(error);
                                    return  error;

                                    //   inserts.push(results);
                                };

                            });

                            connection.end();

                            socket.on('cancel_trip_provider',function (datas) {
                                console.log("cancel_trip_provider event data",datas)
                                // console.log({cancel_trip_userssssssssss:Request})

                                var   datasrequest = {
                                    s_latitude: data.request.s_latitude,
                                    s_longitude: data.request.s_longitude,
                                    d_latitude:  data.request.d_latitude,
                                    d_longitude: data.request.d_longitude,
                                    first_name: data.request.first_name,
                                    last_name: data.request.last_name,
                                    email: data.request.email,
                                    picture: data.request.picture,
                                    rating: '5.00',
                                    mobile: data.request.mobile,
                                    status: 'SEARCHING',
                                    booking_id: 0,
                                    s_address_ar: data.request.s_address_ar,
                                    d_address_ar: data.request.d_address_ar,
                                    id: data.request.id,
                                    service_type:  data.request.service_type,
                                    distance: data.request.distance,
                                    schedule_date: data.request.schedule_date,
                                    schedule_time: data.request.schedule_time,
                                    use_wallet: 0,
                                    payment_mode: data.request.payment_mode,
                                    request_id: tripid,
                                }

                                datasrequest.rejectedProviders = [data.response.id]
                                var datarequest = {request:datasrequest}
                                requestScduleTrip = datarequest;
                                datarequest.UserId = UserId;

                                Requests['Request'+data.request.id] = datarequest;
                                SendRequest(Requests['Request'+data.request.id]);

                                // io.emit(data.request);



                                // save cancel in to data base 

                                let current_datetime = new Date()
                                let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds() 
                                
    
                    var connection = mysql.createConnection({
                        host:"localhost",
                        user:"root",
                        password:"",
                        database:"ailbazco_db"
                    })

                    connection.connect();
                    connection.query("INSERT INTO"  +
                        " provider_user_requests("+
                        "provider_id,"+
                        "user_request_id,"+
                        "cancel_reason,"+
                        "updated_at,"+
                        "created_at"+
                        ") VALUES ("+
                        
                        "'"+ datas.provider_id +"'"+","+
                        "'"+  datas.Trip_id  +"'"+","+
                        "'"+   datas.reason   +"'"+","+
                        "'"+   formatted_date   +"'"+","+
                        "'"+  formatted_date    +"'"+")",(error,results,fields)=>{
                        if(!error){
                            console.log(results);
                            // return inserts.push(results)
                            return results
                            // res.push(results);

                        }else{
                            console.log(error);
                            return  error;
                            //   inserts.push(results);
                        };

                    });

                    connection.end();


                            });

                            // for (var i = 0 ; i < providerIdArr.length  ;i++  ) {
                            //
                            //
                            //     if (data.response.id == providerIdArr[i] ) {
                                    //   io.emit("Trip_Accept",data)
                                    data.Trip_id = tripid;
                            Providerss[data.response.id].emit("accept", data);///user

                            Clientss[data.request.id].emit('accept', data);

                            data.request.provider_email = data.response.email;
                                    //io.emit("confirm",{message:data.id});

                                    var providerInfo = {
                                        provider_email: data.email,
                                        provider_phone: data.mobile,
                                        Trip_id: tripid.toString()
                                    }
                                    console.log({ClientsIdArr: ClientsIdArr});
                                    var emailStr = data.email;
                                    var phoneStr = data.mobile;
                                    var x = 0;

                                    socket.on("Arrived",function (datas) {
                                        // query("select * from  user_requests where id = data ")


                                        var connection = mysql.createConnection({
                                            host:"127.0.0.1",
                                            user:"root",
                                            password:"",
                                            database:"ailbazco_db"
                                        })

                                        connection.connect();


                                        connection.query(' UPDATE user_requests SET   status =  ' +
                                            '"ARRIVED"' +","+" updated_at ="
                                            +"  NOW() "  +

                                            ' WHERE id = ' +

                                            "'"+ tripid+"'"+
                                            '   ',(error,results,fields)=>{

                                            if(!error){
                                                console.log(results);
                                                // return inserts.push(results)

                                                return results
                                                // res.push(results);

                                            }else{
                                                console.log(error)
                                                return  error;

                                                //   inserts.push(results);


                                            }



                                        });



                                        connection.query('select updated_at from user_requests' +
                                            ' WHERE id = ' +

                                            "'"+ tripid+"'"+
                                            '',(error,results,fields)=>{

                                            if(!error){
                                                console.log(results[0]);
                                                // return inserts.push(results)
                                                setArriveDate(results[0].updated_at);
                                                return results
                                                // res.push(results);

                                            }else{
                                                console.log(error)
                                                return  error;

                                                //   inserts.push(results);


                                            }



                                        });

                                        connection.end();

                                    });





                                    socket.on("pickedUp", function (pickkkk) {
                                    setStartLatAndLong(pickkkk.D_lat,pickkkk.D_long);

                                        if (requestScduleTrip != '') {
                                            tripid = requestScduleTrip.request.request_id

                                        }


                                        var connection = mysql.createConnection({
                                            host: "127.0.0.1",
                                            user: "root",
                                            password: "",
                                            database: "ailbazco_db"
                                        })

                                        connection.connect();


                                        connection.query(' UPDATE user_requests SET   status =  ' +
                                            '"STARTED"' + ", updated_at ="
                                            + "NOW()   " +
                                            ' WHERE id = ' +

                                            "'" + tripid + "'" +
                                            '   ', (error, results, fields) => {

                                            if (!error) {
                                                console.log(results);
                                                // return inserts.push(results)

                                                return results
                                                // res.push(results);

                                            } else {
                                                console.log(error)
                                                return error;

                                                //   inserts.push(results);


                                            }

                                        });


                                        connection.query('select updated_at from user_requests ' +
                                            ' WHERE id = ' +

                                            "'" + tripid + "'" +
                                            '', (error, results, fields) => {

                                            if (!error) {
                                                setPickupDate(results[0].updated_at);
                                                console.log(results[0].updated_at);
                                                // return inserts.push(results)
                                                return results
                                                // res.push(results);

                                            } else {
                                                console.log(error)
                                                return error;

                                                //   inserts.push(results);


                                            }


                                        });


                                        connection.end();

                                        // if( parseInt(data.request.id)  == ClientsIdArr[x]){


                                        Providerss[data.response.id].emit("pickedUp", data);//user
                                        Clientss[data.request.id].emit('pickedUp', data);
                                        // }
                                        //

                                    })

                                    function setArriveDate(data) {
                                        console.log(data);
                                        arriveDate = data;


                                    }

                                    function setPickupDate(data) {
                                        pickupDate = data;


                                    }


                                    var time2 = 0;

                            function setStartLatAndLong(s_lattiude,s_longtude) {
                                s_lat = s_lattiude;
                                s_long = s_longtude;
                                console.log({s_lat:s_lat,s_long:s_long})
                            }
                                    socket.on("dropped", function (dropedddd) {

                                            d_lat = dropedddd.D_lat;
                                            d_long = dropedddd.D_long;
            console.log({d_lat:d_lat,d_long:d_long})
                                    var distance =    getDistanceFromLatLonIMm(s_lat,s_long,d_lat,d_long)
                                        console.log({distance:distance})
                                        var info = data;

                                        console.log("droppppppppppppppppppppppppped")

                                        var dates = pickupDate.toString();
                                        var res = dates.substr(16, 9);
                                        var res2 = res.split(":");
                                        var hours2 = parseInt(res2[0]);
                                        var minutes2 = parseInt(res2[1]);
                                        var seconds2 = parseInt(res2[2]);

                                        var dates1 = arriveDate.toString();
                                        var res1 = dates1.substr(16, 9);
                                        var res21 = res1.split(":");
                                        var hours1 = parseInt(res21[0]);
                                        var minutes1 = parseInt(res21[1]);
                                        var seconds1 = parseInt(res21[2]);


                                        var differhours = hours2 - hours1;
                                        var differmintues = minutes2 - minutes1;
                                        var differseconds = seconds2 - seconds1;
                                        var time = 0;
                                        if (differhours != 0) {
                                            time += differhours * 60;
                                        } else if (differmintues != 0) {
                                            time += differmintues
                                        }
                                        console.log({waitTime: time});
                                        // console.log(date1)

                                        // var difference = data1 - data2;

                                        //  console.log(difference);


                                        var connection = mysql.createConnection({
                                            host: "127.0.0.1",
                                            user: "root",
                                            password: "",
                                            database: "ailbazco_db"
                                        })

                                        connection.connect();


                                        connection.query(' select fixed ,price , min_wait_price from service_types WHERE id = '
                                            + "'" + requestClient.service_type + "'", (error, results, fields) => {

                                            if (!error) {
                                                console.log({setServiceTypes: results[0].price});
                                                setServiceTypes(results[0].fixed, results[0].price, results[0].min_wait_price);

                                                // return inserts.push(results)
                                                return results
                                                // res.push(results);

                                            } else {
                                                console.log(error)
                                                return error;

                                                //   inserts.push(results);


                                            }

                                        });


                                        connection.query(' UPDATE user_requests SET   status =  ' +
                                            '"DROPPED"' + ", updated_at ="
                                            + "  NOW()   " +
                                            ' WHERE id = ' +
                                            "'" + tripid + "'" +
                                            '   ', (error, results, fields) => {

                                            if (!error) {


                                                // return inserts.push(results)
                                                return results
                                                // res.push(results);

                                            } else {
                                                console.log({error: error})
                                                return error;

                                                //   inserts.push(results);


                                            }

                                        });


                                        connection.query('select updated_at from user_requests ' +
                                            ' WHERE id = ' +

                                            "'" + tripid + "'" +
                                            '', (error, results, fields) => {

                                            if (!error) {


                                                var dropdate = results[0].updated_at;

                                                var dates = dropdate.toString();
                                                var res = dates.substr(16, 9);
                                                var res2 = res.split(":");
                                                var hours2 = parseInt(res2[0]);
                                                var minutes2 = parseInt(res2[1]);
                                                var seconds2 = parseInt(res2[2]);
                                                console.log({pickupDate: pickupDate})

                                                var dates1 = pickupDate.toString();
                                                var res1 = dates1.substr(16, 9);
                                                var res21 = res1.split(":");
                                                var hours1 = parseInt(res21[0]);
                                                var minutes1 = parseInt(res21[1]);
                                                var seconds1 = parseInt(res21[2]);

                                                var differhours = hours2 - hours1;
                                                var differmintues = minutes2 - minutes1;
                                                var differseconds = seconds2 - seconds1;
                                                var time2 = 0;
                                                if (differhours != 0) {
                                                    time2 += differhours * 60;
                                                } else if (differmintues != 0) {
                                                    time2 += differmintues
                                                }

                                                setDropDate(time2);
                                                // return inserts.push(results)
                                                return results
                                                // res.push(results);

                                            } else {
                                                console.log(error)
                                                return error;

                                            }

                                        });

                                        connection.end();

                                        var fixed_price = 0;
                                        var price_journy = 0;
                                        var min_wait_prices = 0;

                                        function setServiceTypes(fixed, price, min_wait_price) {
                                            console.log({min_wait_price: min_wait_price});
                                            fixed_price = fixed
                                            price_journy = price;
                                            min_wait_prices = min_wait_price;
                                        }



                                        var distance_price = distance * price_journy;
                                        var wattingTime = time;
                                        var watting_price = min_wait_prices * wattingTime;
                                        var tripTime = 1;
                                        var time_price =  1 * price_journy;




                                        // console.log({servicestype:servicestype});
                                        function setDropDate(data) {


                                            console.log({min_wait_prices: min_wait_prices});
                                            console.log({time: time});





                                            console.log({fixed_price: fixed_price});
                                            console.log({distance_price: distance_price});
                                            console.log({wattingTime: wattingTime});
                                            console.log({price: price_journy});
                                            console.log({tripTime: data});
                                            console.log({time_price: time_price});

                                            var total_price =   fixed_price + distance_price + time_price;
                                            //   requestClient


                                        var distanceee =    parseInt(distance);
                                            var bill = {
                                                distance: distanceee,
                                                distance_price: distance_price,
                                                watting_price: 0,
                                                time_price: time_price,
                                                total_price: total_price,
                                                fixed_price: fixed_price,
                                                tripTime: data,
                                                wattingTime: 0
                                            };
                                            info.bill = bill;
                                            console.log({bill:info})

                                            console.log({provider_email: provider_email})
                                            provider_email = "";
                                            Providerss[info.response.id].emit('bill', info);
                                            Clientss[info.request.id].emit('bill', info);
                                        }
                                    // io.emit('bill', {message:'billlls'});

                                    });

                                    socket.on('ConfirmPaid', function () {

                                        var connection = mysql.createConnection({
                                            host: "127.0.0.1",
                                            user: "root",
                                            password: "",
                                            database: "ailbazco_db"
                                        })

                                        connection.connect();


                                        connection.query(' UPDATE user_requests SET   status =  ' +
                                            '"COMPLETED"' + ", updated_at ="
                                            + "  NOW()   " +
                                            ' WHERE id = ? '
                                            , [tripid], (error, results, fields) => {

                                                if (!error) {

                                                    return results
                                                    // res.push(results);

                                                } else {
                                                    console.log(error)
                                                    return error;

                                                    //   inserts.push(results);


                                                }

                                            });

                                        connection.end();

                                        Providerss[data.response.id].emit('ConfirmPaid', data);
                                        Clientss[data.request.id].emit('ConfirmPaid', data);

                                    });
                            //   } else {
                            //
                            //   }
                            //
                            //
                            //
                            //
                            // }


                            emitOn( Providerss[data.response.id],'confirm',{case:"true",message:"hello fred",Trip_id : tripid.toString(),provider_email:data.response.email,provider_phone:data.response.mobile},data._id);


                         delete Requests['Request'+data.request.id];
                            AcceptedRequests['Request'+data.request.id] = data.request;

                        }else{

                            emitOn(io,'confirm','false',Providers[UserId].socket_id);
                        }
                    }
            //

    });

    socket.on('disconnect', function() {
        console.log('disconnect',socket.id);
        UserType == Clients?delete Clients[UserId]:delete Providers[UserId],DeleteFromRequestedProvider(UserId);

    });

// console.log({UserIdsssssssss:UserId});
//
//
//
//         function  emitdataaccept(data){
//             console.log({UserIddddddd:UserId})
//             io.emit("accept", data);
//         }






    function SendRequest(Data){

console.log("SendRequest to providers",{RequestedProviders:Data})
        for (var Provider in Providers) {

            if(RequestedProviders.indexOf(Provider) <= -1 && Data.request.rejectedProviders.indexOf(Provider) == -1){
                console.log({Providerindex:Data.request.rejectedProviders.indexOf(Provider)})
                var requestLatitude = Data.request.s_latitude,
                    requestLongitude = Data.request.s_longitude,
                    providerLatitude = Providers[Provider].lat,
                    providerLongitude = Providers[Provider].long,
                    providerRange = Providers[Provider].range;
                console.log({providerLatitude:providerLatitude,providerLongitude:providerLongitude,requestLatitude:requestLatitude,requestLongitude:requestLongitude,providerRange:providerRange});
                if(getDistanceFromLatLonIMm(providerLatitude,providerLongitude,requestLatitude,requestLongitude) <= providerRange){
                  console.log({request_range:Data})

                    emitOn(io,'request_range',Data,Providers[Provider].socket_id);
console.log("sdsdsddjshygbyudsb")
                    RequestedProviders.push(Provider);
                }
            }
        }
    }
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
}



// function setacceptdata(data) {
// if(data.request.id == 3){
//     io.emit("accept", data);
// }
// }


function getDistanceFromLatLonIMm(lat1,lon1,lat2,lon2) {
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


