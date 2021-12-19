var express = require("express"); //// run the server on the express 
var socket = require("socket.io");   ///// require socket.io 
var mysql = require("mysql");////connect to my sqli 
var request = require('request');
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
var requestClient = [];
var requestScduleTrip = '';
var Providerss = {};
var Clientss = {};

io.on('connection', function (socket) {    ////// connection add eventlistner 

    var UserLat = socket.handshake.query.lat;
    var UserLong = socket.handshake.query.long;
    var UserType = socket.handshake.query.type;
    var UserId = socket.handshake.query.id;
    var UserService = socket.handshake.query.service;

    if (UserType == 'Clients') {
        console.log('userType is Clients  ', socket.id);
        Clients[UserId] = { "socket_id": socket.id, "lat": UserLat, "long": UserLong, Clients_id: UserId };
        console.log('users', Clients);
        Clientss[UserId] = socket;

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
        console.log('userType is provider userType is provider ', socket.id);
        Providers[UserId] = {
            "socket_id": socket.id, "lat": UserLat, "long": UserLong, "provider_id": UserId,
            "range": socket.handshake.query.range,
            "provider_service": UserService
        };
        Providerss[UserId] = socket;
        console.log("providers are ", Providers);

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
                         console.log("send request to this provider this provider new connect",Requests[Request]);
                        emitOn(io, 'request_range', Requests[Request], socket.id);
                        RequestedProviders.push(UserId);
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
                }
            }

        }
    }

    socket.on('request_range_clients', function (data) {
        console.log("request_range_clients event user", data);
        setValues(data.request);
        var connection = mysql.createConnection({
            host: "localhost",
            user: "root",
            port: 3307,
            password: "",
            database: "ailbazco_db"
        });

        connection.connect();

        let current_datetime = new Date()
        let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + " " + current_datetime.getHours() + ":" + current_datetime.getMinutes() + ":" + current_datetime.getSeconds()
        //created_at,use_wallet,distance     +      "'" + data.request.use_wallet + "',"   +  
        connection.query("INSERT INTO user_requests(created_at,user_id,use_wallet,distance) VALUES (" + "'" + formatted_date + "'," + "'" + data.request.id + "'," + "'" + data.request.use_wallet + "'," + "'" + data.request.distance + "')", function (error, results, fields) {
            if (!error) {
                console.log("insert request in data base  and this is trib id", results.insertId);
                settripid(data, results.insertId);
                return results

            } else {
                console.log(error);

                return error;
            };
        });
        connection.end();

    });

    socket.on('request_range_provider', function (data) {

      

        console.log("request_range_provider event provider", data);

        if (data.Status == 'Reject') {
            //  console.log("request_range_provider event provider reject");
            //  console.log("provider_id", data.response.id);
            DeleteFromRequestedProvider(data.response.id);
        }
        else if (data.Status == 'Ignore') {
        }
        else if (data.Status == 'Accept' && Requests['Request' + data.request.id] != null) {

            Providerss[data.response.id].broadcast.emit('not_confirm', { Trip_id: data.request.Trip_id });
            deleteTripTuneFromRequestedProviders(data.response.id, data.request.Trip_id);
            // provider_email = data.response.email;
            if (requestScduleTrip != '') {
                tripid = requestScduleTrip.request.request_id
                requestClient[data.request.id] = requestScduleTrip.request;
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
                         console.log("data has been updated after driver accepted", results);
                        return results
                    } else {
                        console.log(error);
                        return error;
                    };

                });
            connection.end();
            data.Trip_id = data.request.Trip_id;
            Providerss[data.response.id].emit("accept", data);
             console.log("data send to client driver has been accepted your trip");
            Clientss[data.request.id].emit('accept', data);

            data.request.provider_email = data.response.email;
            data.request.provider_phone = data.response.mobile;

            emitOn(Providerss[data.response.id], 'confirm', { case: "true", message: "hello fred", Trip_id: data.Trip_id.toString(), provider_email: data.response.email, provider_phone: data.response.mobile }, data.id);
            AcceptedRequests['Request' + data.request.id] = data.request;
            AcceptedRequests['Request' + data.request.id].aldrejected = Requests['Request' + data.request.id].request.rejectedProviders;
            delete Requests['Request' + data.request.id];


        } else {
            emitOn(io, 'confirm', 'false', Providers[data.response.id].socket_id);
        }

    });

    socket.on("Arrived_provider", function (datas) {

        console.log("Arrived_provider data", datas);

        var connection = mysql.createConnection({
            host: "localhost",
            user: "root",
            port: 3307,
            password: "",
            database: "ailbazco_db"
        });

        connection.connect();
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

        var obj = {
            "first_name": datas.first_name,
            "last_name": datas.last_name,
            "email": datas.email,
            "rating": datas.rating,
            "mobile": datas.mobile,
            "picture": datas.picture
        }
        var obgpickedUp = {
            response: obj
        }

        Clientss[datas.client_id].emit('arrived', obgpickedUp);
    });

    socket.on("pickedUp_provider", function (pickkkk) {

        console.log("pickedUp_provider event", pickkkk);

        var slatandslotcorrrect = ' ';
        if (pickkkk.D_lat > "0.0" && pickkkk.D_long > "0.0") {
            slatandslotcorrrect = ", s_latitude =" + "'" + pickkkk.D_lat + "'" + ", s_longitude =" + "'" + + pickkkk.D_long + "'";
        }

        if (requestScduleTrip != '') {
            tripid = requestScduleTrip.request.request_id
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
            '"STARTED"' + ", updated_at ="
            + "NOW()   " + ", started_at =" + "NOW()   " + slatandslotcorrrect +
            ' WHERE id = ' +
            "'" + pickkkk.Trip_id + "'" +
            '   ', (error, results, fields) => {

                if (!error) {
                    console.log(results);
                    return results
                } else {
                    console.log(error)
                    return error;
                }
            });

        connection.query('select updated_at ,user_id from user_requests ' +
            ' WHERE id = ' +
            "'" + pickkkk.Trip_id + "'" +
            '', (error, results, fields) => {

                if (!error) {
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

                } else {
                    console.log(error)
                    return error;
                }
            });

        connection.end();

    });

    socket.on("dropped_provider", function (dropedddd) {
        console.log("dropped_provider event", dropedddd)
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


        request.post(
            'http://5.189.186.251/ailbaz_server/public/api/provider/create_trip_payment',
            {
                json: {
                    "Trip_id": dropedddd.Trip_id
                }
            },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {

                    if (typeof response.body != undefined) {


                        var bill = {
                            distance: Math.round(response.body.data.distance * 10) / 10,
                            distance_price: Math.round(response.body.data.price * response.body.data.distance * 10) / 10,
                            watting_price: Math.round(response.body.data.WaitingPrice * 10) / 10,
                            time_price: Math.round(response.body.data.min_wait_price * 10) / 10,
                            total_price: Math.round(response.body.data.total * 10) / 10,
                            fixed_price: Math.round(response.body.data.fixed * 10) / 10,
                            discount_wallet: Math.round(response.body.data.discount_wallet * 10) / 10,
                            tripTime: Math.round(response.body.data.time_trip),
                            wattingTime: Math.round(response.body.data.WaitingTime),
                            tax: Math.round(response.body.data.tax * 10) / 10,
                            Trip_id: dropedddd.Trip_id
                        };
                        var info = {};
                        info.bill = bill;
                        console.log("bill", info);
                        Providerss[dropedddd.provider_id].emit('bill', info);
                        Clientss[dropedddd.userID].emit('bill', info);

                    }
                }
            }
        );



    });

    socket.on('ConfirmPaid_provider', function (data) {
        console.log("ConfirmPaid_provider event")
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
        delete TripsProviderAfterWating[data.Trip_id];
        DeleteFromRequestedProvider(data.provider_id);      
        Clientss[data.userID].emit('ConfirmPaid', data);
    });


    socket.on('provider_after_waiting', function (datastripId) {
        console.log("provider_after_waiting", datastripId);
        TripsProviderAfterWating.push(datastripId);
        console.log("TripsProviderAfterWating", TripsProviderAfterWating);
    });


    socket.on('cancel_trip_provider', function (datas) {
        console.log("cancel_trip_provider event", datas)
        DeleteFromRequestedProvider(datas.provider_id);
       
        if (TripsProviderAfterWating.includes(datas.Trip_id) == true) {
            console.log("datas.UserID TripsProviderAfterWating",datas.UserID);
            delete TripsProviderAfterWating[datas.Trip_id];
            providerCancelTripAndAddTripCostFromUserToProvider(datas.provider_id,datas.Trip_id,datas.UserID);
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
                + "  NOW() " + "," + " provider_id =" + "'0'" +
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
                        console.log("result get data from data base  is null no trip or error in trip id");
                    } else {
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
                        // console.log("provider_cancel_your_trip_is_searching");
                        console.log("provider_cancel_your_trip_is_searching obj",obj);
                       Clientss[data.id].emit('provider_cancel_your_trip_is_searching', obgpickedUp);
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
    });


    socket.on('schedule_trip', function (data) {
        console.log("schedule_trip event", data);

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

    });



    socket.on('confirm_schedule_trip', function (status) {
        console.log("confirm_schedule_trip event", status);
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
    });


    socket.on('cancel_trip_user', function (datas) {
        // Tri
        console.log("cancel event from user ", datas);
       
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
                
                Clientss[datas.client_id].broadcast.emit('start_not_confirm', { Trip_id: datas.Trip_id });

            }
            
            for (var i = 0; i < ProvidersTripTune[datas.Trip_id].length; i++) {
                Providerss[ProvidersTripTune[datas.Trip_id][i]].broadcast.emit('not_confirm', { Trip_id: datas.Trip_id });
                    DeleteFromRequestedProvider(ProvidersTripTune[datas.Trip_id][i]);
            }

            delete ProvidersTripTune[datas.Trip_id];

        } else {

            // if trip status arrived add base cost  to driver
            console.log(" befor chick user cancel after driver arrived");
            

            var connectionnn = mysql.createConnection({
                host: "localhost",
                user: "root",
                port: 3307,
                password: "",
                database: "ailbazco_db"
            });
            connectionnn.connect();
    
            connectionnn.query('select status from user_requests' +
            ' WHERE id = ' +
    
            "'" + datas.Trip_id + "'" +
            '', (error, results, fields) => {
    
                if (!error) {
                    console.log("get data from data base this data is ",results[0].status );
                            if(results[0].status == 'ARRIVED'){
                                console.log("user cancel after driver arrived");
                               
                                usercCancelTripAndAddTripCostFromUserToProvider(datas.provider_id,datas.Trip_id,datas.client_id,datas.reason );
                            }
                            else{
                                console.log("user cancel befor driver arrived");
                                userCancelPutProviderNotArrived(datas);
                            }
                            DeleteFromRequestedProvider(datas.provider_id);
                } else {
                    console.log(error);
                }
    
            });
            connectionnn.end();
        }

    });


    socket.on('delete_request', function (user_id) {
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
            });
        connection.end();
    }
    });

    socket.on('provider_free', function (providerfreeData) {
        console.log("provider_free event data is ", providerfreeData);
        console.log("RequestedProviders befor ", RequestedProviders);
        DeleteFromRequestedProvider(providerfreeData.provider_id);
        console.log("RequestedProviders after ", RequestedProviders);

    });


    socket.on('disconnect', function () {
        console.log('disconnect', socket.id);

        for (var clientttt in Clients) {
            if (Clients.hasOwnProperty(clientttt)) {
                console.log("one socket client disconnect", Clients[clientttt].socket_id);
                if (Clients[clientttt].socket_id == socket.id) {
                    delete Clients[clientttt];
                    console.log("Clients after deleted ", Clients);
                }
            }
        }

        for (var Providerrrrrr in Providers) {
            if (Providers.hasOwnProperty(Providerrrrrr)) {
                console.log("one socket provider disconnect", Providers[Providerrrrrr].socket_id);
                if (Providers[Providerrrrrr].socket_id == socket.id) {
                    delete Providers[Providerrrrrr];
                    console.log("Providers after deleted ", Providers);
                }
            }
        }

    });
});



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

function setValues(data) {
    // console.log(data);
    requestClient[data.id] = data;
}

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
    console.log("new requist RequestedProviders RequestedProviders are", RequestedProviders);
    console.log("new requist rejectedProviders are", Data.request.rejectedProviders);
    for (var Provider in Providers) {

        if (RequestedProviders.indexOf(Provider) <= -1 && Data.request.rejectedProviders.indexOf(Provider) <= -1 && Data.request.rejectedProviders.includes(parseInt(Provider)) == false) {
            var requestLatitude = Data.request.s_latitude,
                requestLongitude = Data.request.s_longitude,
                providerLatitude = Providers[Provider].lat,
                providerLongitude = Providers[Provider].long,
                provider_service = Providers[Provider].provider_service,
                providerRange = Providers[Provider].range;

            if (getDistanceFromLatLonIMm(providerLatitude, providerLongitude, requestLatitude, requestLongitude) <= providerRange && Data.request.service_type == provider_service) {
                 console.log("send request to this provider",Data);
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
        }
    }
    console.log("ProvidersTripTune are ", ProvidersTripTune);
}

function DeleteFromRequestedProvider(Provider) {
    if (RequestedProviders.indexOf(Provider) > -1) {
        RequestedProviders.splice(RequestedProviders.indexOf(Provider), 1);
    }
}

function deleteTripTuneFromRequestedProviders(provider_id, Trip_id) {

    console.log("RequestedProviders befor tune delateng", RequestedProviders);

    for (var i = 0; i < ProvidersTripTune[Trip_id].length; i++) {

        if (ProvidersTripTune[Trip_id][i] !== provider_id) {
            DeleteFromRequestedProvider(ProvidersTripTune[Trip_id][i]);
        }
    }

    delete ProvidersTripTune[Trip_id];
    console.log("RequestedProviders after tune delateng", RequestedProviders);
}



function providerCancelTripAndAddTripCostFromUserToProvider(provider_id,Trip_id,client_id) {

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
                 
                   console.log("responce from data base provider_cancel_trip_after_waiting",response.body);
                   console.log("send event to provider_cancel_trip_after_waiting",response.body);

                    Providerss[provider_id].emit('provider_cancel_trip_after_waiting', { Trip_id:Trip_id, provider_email: "admin@ali.com" });
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


    console.log("'Cancel This Trip After Wating'");
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
}

function userCancelPutProviderNotArrived(datas){
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
                    Clientss[client_id].emit('user_cancel_trip_after_waiting', obgpickedUp);
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


    console.log("' user Cancel This Trip After Wating'");

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
