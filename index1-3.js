var express = require("express"); //// run the server on the express
var socket = require("socket.io"); ///// require socket.io
var mysql = require("mysql"); /////connect to my sqli

var request = require("request");

var port = process.env.port || 3000;
var app = express();
var server = app.listen(port, () =>
  console.log(`the app is listining to port  ${port}`)
);
// Static Files
app.use(express.static("public")); ///// move to puplic folder (chat app)
// global variable
var io = socket(server); ///// include the server inside the socket
var Clients = {};
var Providers = {};
var RequestedProviders = [];
var Requests = {};
var AcceptedRequests = [];

var requestClient = [];

var requestScduleTrip = "";

var Providerss = {};
var Clientss = {};

io.on("connection", function (socket) {
  ////// connection add eventlistner

  var UserLat = socket.handshake.query.lat;
  var UserLong = socket.handshake.query.long;
  var UserType = socket.handshake.query.type;
  var UserId = socket.handshake.query.id;
  var UserService = socket.handshake.query.service;
  if (UserType == "Clients") {
    console.log("userType is Clients  ", socket.id);
    Clients[UserId] = {
      socket_id: socket.id,
      lat: UserLat,
      long: UserLong,
      Clients_id: UserId,
    };
    console.log("users", Clients);
    Clientss[UserId] = socket;

    var connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      port: 3307,
      password: "",
      database: "ailbazco_db",
    });

    connection.connect();
    connection.query(
      "SELECT user_requests.*, users.* ,user_requests.id as tripid    FROM user_requests INNER JOIN users ON user_requests.user_id=users.id where  user_id = ? and schedule_at IS NOT NULL ORDER BY user_requests.id DESC LIMIT 1",
      [UserId],
      function (error, results, fields) {
        if (!error) {
          if (results.length == 0) {
            console.log("result get data from data base  is null");
            setvaluedatescdule(null);
          } else {
            console.log("result get data from data base ", results[0]);
            setvaluedatescdule(
              results[0].schedule_at.toLocaleString(),
              results[0].tripid,
              results[0].s_address_ar,
              results[0].s_address_en,
              results[0].d_address_ar,
              results[0].d_address_en,
              results[0].mobile,
              results[0].email,
              results[0].id
            );
          }
        } else {
          console.log("error get data from data base", error);
          return error;
        }
      }
    );
    connection.end();
  } else {
    console.log("userType is provider ", socket.id);
    Providers[UserId] = {
      socket_id: socket.id,
      lat: UserLat,
      long: UserLong,
      provider_id: UserId,
      range: socket.handshake.query.range,
      provider_service: UserService,
    };
    Providerss[UserId] = socket;
    console.log("providers are ", Providers);
    if (Object.size(Requests) > 0) {
      for (var Request in Requests) {
        SendRequest(Requests[Request]);
      }
    }
  }

  socket.on("request_range_clients", function (data) {
    console.log("request_range_clients event user", data);
    setValues(data.request);
    var connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      port: 3307,
      password: "",
      database: "ailbazco_db",
    });

    connection.connect();

    let current_datetime = new Date();
    let formatted_date =
      current_datetime.getFullYear() +
      "-" +
      (current_datetime.getMonth() + 1) +
      "-" +
      current_datetime.getDate() +
      " " +
      current_datetime.getHours() +
      ":" +
      current_datetime.getMinutes() +
      ":" +
      current_datetime.getSeconds();
    //created_at,use_wallet,distance     +      "'" + data.request.use_wallet + "',"   +
    connection.query(
      "INSERT INTO user_requests(created_at,user_id,use_wallet,distance) VALUES (" +
        "'" +
        formatted_date +
        "'," +
        "'" +
        data.request.id +
        "'," +
        "'" +
        data.request.use_wallet +
        "'," +
        "'" +
        data.request.distance +
        "')",
      function (error, results, fields) {
        if (!error) {
          console.log(
            "insert request in data base  and this is trib id",
            results.insertId
          );
          settripid(data, results.insertId);
          return results;
        } else {
          console.log(error);

          return error;
        }
      }
    );
    connection.end();
  });

  socket.on("request_range_provider", function (data) {
    console.log("request_range_provider event provider", data);

    if (data.Status == "Reject") {
      DeleteFromRequestedProvider(UserId);
      Requests["Request" + data.request.id].request.rejectedProviders.push(
        parseInt(data.response.id)
      );
    } else if (data.Status == "Ignore") {
    } else if (
      data.Status == "Accept" &&
      Requests["Request" + data.request.id] != null
    ) {
      Providerss[data.response.id].broadcast.emit("not_confirm", {
        Trip_id: data.request.Trip_id,
      });
      provider_email = data.response.email;
      if (requestScduleTrip != "") {
        tripid = requestScduleTrip.request.request_id;
        requestClient[data.request.id] = requestScduleTrip.request;
      }
      var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        port: 3307,
        password: "",
        database: "ailbazco_db",
      });

      connection.connect();

      connection.query(
        "UPDATE user_requests SET " +
          "booking_id=0,user_id=?,provider_id=?," +
          "current_provider_id=?,service_type_id=?,status=?," +
          "s_address_ar=?,s_address_en=?,s_latitude=?,s_longitude=?," +
          "d_address_ar=?,d_address_en=?,d_latitude=?,d_longitude=?," +
          "updated_at=? WHERE id = ?",
        [
          data.request.id,
          data.response.id,
          data.request.id,
          data.request.service_type,
          "ACCEPTED",
          data.request.s_address_ar,
          data.request.s_address_en,
          data.request.s_latitude,
          data.request.s_longitude,
          data.request.d_address_ar,
          data.request.d_address_en,
          data.request.d_latitude,
          data.request.d_longitude,
          new Date(),
          data.request.Trip_id,
        ],
        function (error, results, fields) {
          if (!error) {
            // console.log("data has been updated after driver accepted", results);
            return results;
          } else {
            console.log(error);
            return error;
          }
        }
      );

      connection.end();

      data.Trip_id = data.request.Trip_id;
      Providerss[data.response.id].emit("accept", data);
      console.log(
        "data send to client driver has been accepted your trip",
        data
      );
      Clientss[data.request.id].emit("accept", data);

      data.request.provider_email = data.response.email;

      emitOn(
        Providerss[data.response.id],
        "confirm",
        {
          case: "true",
          message: "hello fred",
          Trip_id: data.Trip_id.toString(),
          provider_email: data.response.email,
          provider_phone: data.response.mobile,
        },
        data.id
      );

      AcceptedRequests["Request" + data.request.id] = data.request;
      AcceptedRequests["Request" + data.request.id].aldrejected =
        Requests["Request" + data.request.id].request.rejectedProviders;
      delete Requests["Request" + data.request.id];
    } else {
      emitOn(io, "confirm", "false", Providers[data.response.id].socket_id);
    }
  });

  socket.on("Arrived_provider", function (datas) {
    // console.log("Arrived_provider data", datas);

    var connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      port: 3307,
      password: "",
      database: "ailbazco_db",
    });

    connection.connect();
    connection.query(
      " UPDATE user_requests SET   status =  " +
        '"ARRIVED"' +
        "," +
        " updated_at =" +
        "  NOW() " +
        "," +
        " arrived_at =" +
        "  NOW() " +
        " WHERE id = " +
        "'" +
        datas.Trip_id +
        "'" +
        "   ",
      (error, results, fields) => {
        if (!error) {
          // console.log("Arrived_provider results", results);
          return results;
        } else {
          console.log(error);
          return error;
        }
      }
    );

    connection.query(
      "select updated_at from user_requests" +
        " WHERE id = " +
        "'" +
        datas.Trip_id +
        "'" +
        "",
      (error, results, fields) => {
        if (!error) {
          return results;
        } else {
          console.log(error);
          return error;
        }
      }
    );

    connection.end();

    var obj = {
      first_name: datas.first_name,
      last_name: datas.last_name,
      email: datas.email,
      rating: datas.rating,
      mobile: datas.mobile,
      picture: datas.picture,
    };
    var obgpickedUp = {
      response: obj,
    };

    Clientss[datas.client_id].emit("arrived", obgpickedUp);
  });

  socket.on("pickedUp_provider", function (pickkkk) {
    console.log("pickedUp_provider event", pickkkk);

    var slatandslotcorrrect = " ";
    if (pickkkk.D_lat > "0.0" && pickkkk.D_long > "0.0") {
      slatandslotcorrrect =
        ", s_latitude =" +
        "'" +
        pickkkk.D_lat +
        "'" +
        ", s_longitude =" +
        "'" +
        +pickkkk.D_long +
        "'";
    }

    if (requestScduleTrip != "") {
      tripid = requestScduleTrip.request.request_id;
    }
    var connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      port: 3307,
      password: "",
      database: "ailbazco_db",
    });

    connection.connect();

    connection.query(
      " UPDATE user_requests SET   status =  " +
        '"STARTED"' +
        ", updated_at =" +
        "NOW()   " +
        ", started_at =" +
        "NOW()   " +
        slatandslotcorrrect +
        " WHERE id = " +
        "'" +
        pickkkk.Trip_id +
        "'" +
        "   ",
      (error, results, fields) => {
        if (!error) {
          console.log(results);
          return results;
        } else {
          console.log(error);
          return error;
        }
      }
    );

    connection.query(
      "select updated_at ,user_id from user_requests " +
        " WHERE id = " +
        "'" +
        pickkkk.Trip_id +
        "'" +
        "",
      (error, results, fields) => {
        if (!error) {
          setPickupDate(results[0].updated_at);
          var user_id = results[0].user_id;
          console.log(results[0].updated_at);
          function setPickupDate(data) {
            pickupDate = data;
          }

          var obj = {
            first_name: pickkkk.first_name,
            last_name: pickkkk.last_name,
            email: pickkkk.email,
            rating: pickkkk.rating,
            mobile: pickkkk.mobile,
            picture: pickkkk.picture,
          };
          var obgpickedUp = {
            response: obj,
          };

          Providerss[pickkkk.provider_id].emit("pickedUp", obgpickedUp); //user
          Clientss[user_id].emit("pickedUp", obgpickedUp);
          return results;
        } else {
          console.log(error);
          return error;
        }
      }
    );

    connection.end();
  });

  socket.on("dropped_provider", function (dropedddd) {
    console.log("dropped_provider event", dropedddd);

    var dlatanddlotcorrrect = " ";
    if (dropedddd.D_lat > "0.0" && dropedddd.D_long > "0.0") {
      dlatanddlotcorrrect =
        ", d_latitude =" +
        "'" +
        dropedddd.D_lat +
        "'" +
        ", d_longitude =" +
        "'" +
        dropedddd.D_long +
        "'";
    }

    var connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      port: 3307,
      password: "",
      database: "ailbazco_db",
    });

    connection.connect();

    connection.query(
      " UPDATE user_requests SET   status =  " +
        '"DROPPED"' +
        ", updated_at =" +
        "  NOW()   " +
        ", finished_at =" +
        "  NOW()   " +
        dlatanddlotcorrrect +
        " WHERE id = " +
        "'" +
        dropedddd.Trip_id +
        "'" +
        "   ",
      (error, results, fields) => {
        if (!error) {
          return results;
        } else {
          console.log({ error: error });
          return error;
        }
      }
    );

    connection.end();

    request.post(
      "http://5.189.186.251/ailbaz_server/public/api/provider/create_trip_payment",
      {
        json: {
          Trip_id: dropedddd.Trip_id,
        },
      },
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          if (typeof response.body != undefined) {
            // console.log("post responce",response.body);

            var bill = {
              distance: Math.round(response.body.data.distance * 10) / 10,
              distance_price:
                Math.round(
                  response.body.data.price * response.body.data.distance * 10
                ) / 10,
              watting_price:
                Math.round(response.body.data.WaitingPrice * 10) / 10,
              time_price:
                Math.round(response.body.data.min_wait_price * 10) / 10,
              total_price: Math.round(response.body.data.total * 10) / 10,
              fixed_price: Math.round(response.body.data.fixed * 10) / 10,
              tripTime: Math.round(response.body.data.time_trip),
              wattingTime: Math.round(response.body.data.WaitingTime),
              tax: Math.round(response.body.data.tax * 10) / 10,
              Trip_id: dropedddd.Trip_id,
            };
            var info = {};
            info.bill = bill;
            console.log("bill", info);

            Providerss[dropedddd.provider_id].emit("bill", info);
            Clientss[dropedddd.userID].emit("bill", info);
          }
        }
      }
    );
  });

  socket.on("ConfirmPaid_provider", function (data) {
    console.log("ConfirmPaid_provider event", data);
    var connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      port: 3307,
      password: "",
      database: "ailbazco_db",
    });

    connection.connect();

    connection.query(
      " UPDATE user_requests SET   status =  " +
        '"COMPLETED"' +
        ", updated_at =" +
        "  NOW()   " +
        ", paid =" +
        +1 +
        " WHERE id = ? ",
      [data.Trip_id],
      (error, results, fields) => {
        if (!error) {
          return results;
        } else {
          console.log(error);
          return error;
        }
      }
    );

    connection.end();

    Providerss[data.provider_id].emit("ConfirmPaid", data);
    DeleteFromRequestedProvider(data.provider_id);
    // console.log("data.userID",data.userID);
    Clientss[data.userID].emit("ConfirmPaid", data);
  });
  socket.on("cancel_trip_provider", function (datas) {
    // data
    console.log("cancel_trip_provider event data", datas);

    var connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      port: 3307,
      password: "",
      database: "ailbazco_db",
    });

    connection.connect();
    connection.query(
      " UPDATE user_requests SET   status =  " +
        '"SEARCHING"' +
        "," +
        " updated_at =" +
        "  NOW() " +
        "," +
        " provider_id =" +
        "'0'" +
        " WHERE id = " +
        "'" +
        datas.Trip_id +
        "'" +
        "   ",
      (error, results, fields) => {
        if (!error) {
          return results;
        } else {
          console.log(error);
          return error;
        }
      }
    );
    connection.query(
      "SELECT user_requests.*, users.* ,user_requests.id as tripid    FROM user_requests INNER JOIN users ON user_requests.user_id=users.id where  user_requests.id = ? LIMIT 1",
      [datas.Trip_id],
      function (error, results, fields) {
        if (!error) {
          if (results.length == 0) {
            console.log("result get data from data base  is null no trip");
          } else {
            console.log("result get data from data base this trip", results[0]);
            var data = results[0];

            var datasrequest = {
              s_latitude: data.s_latitude,
              s_longitude: data.s_longitude,
              d_latitude: data.d_latitude,
              d_longitude: data.d_longitude,
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email,
              picture: data.picture,
              rating: data.rating,
              mobile: data.mobile,
              status: "SEARCHING",
              booking_id: 0,
              s_address_ar: data.s_address_ar,
              d_address_ar: data.d_address_ar,
              id: data.id,
              service_type: data.service_type_id,
              distance: data.distance,
              schedule_date: data.schedule_at,
              schedule_time: data.schedule_at,
              use_wallet: data.use_wallet,
              payment_mode: data.payment_mode,
              request_id: data.tripid,
            };

            datasrequest.rejectedProviders =
              AcceptedRequests["Request" + data.id].aldrejected;
            datasrequest.rejectedProviders.push(parseInt(datas.provider_id));
            console.log("typeof", typeof datasrequest.rejectedProviders.length);
            console.log(
              "datasrequest.rejectedProviders.length",
              datasrequest.rejectedProviders.length
            );
            if (datasrequest.rejectedProviders.length < 2) {
              var datarequest = { request: datasrequest };
              requestScduleTrip = datarequest;
              datarequest.UserId = data.id;

              Requests["Request" + data.id] = datarequest;
              SendRequest(Requests["Request" + data.id]);
            } else {
              console.log("your_trip_is_canceld_from_providers");
              // Clientss[data.id].emit('your_trip_is_canceld_from_providers', { Trip_id: datas.Trip_id });
              Clientss[data.id].emit("your_trip_is_canceld_from_providers", {
                Trip_id: datas.Trip_id,
              });
            }
          }
        } else {
          console.log("result get data from data base", error);
          return error;
        }
      }
    );
    connection.end();

    // save cancel in to data base

    let current_datetime = new Date();
    let formatted_date =
      current_datetime.getFullYear() +
      "-" +
      (current_datetime.getMonth() + 1) +
      "-" +
      current_datetime.getDate() +
      " " +
      current_datetime.getHours() +
      ":" +
      current_datetime.getMinutes() +
      ":" +
      current_datetime.getSeconds();
    var connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      port: 3307,
      password: "",
      database: "ailbazco_db",
    });

    connection.connect();
    connection.query(
      "INSERT INTO" +
        " provider_user_requests(" +
        "provider_id," +
        "user_request_id," +
        "cancel_reason," +
        "updated_at," +
        "created_at" +
        ") VALUES (" +
        "'" +
        datas.provider_id +
        "'" +
        "," +
        "'" +
        datas.Trip_id +
        "'" +
        "," +
        "'" +
        datas.reason +
        "'" +
        "," +
        "'" +
        formatted_date +
        "'" +
        "," +
        "'" +
        formatted_date +
        "'" +
        ")",
      (error, results, fields) => {
        if (!error) {
          console.log(results);
          // return inserts.push(results)
          return results;
          // res.push(results);
        } else {
          console.log(error);
          return error;
          //   inserts.push(results);
        }
      }
    );

    connection.end();
  });

  socket.on("schedule_trip", function (data) {
    console.log("schedule_trip event", data);

    var strdatescdule = data.schedule_date.toString();
    var strtimeschdule = data.schedule_time.toString();

    // console.log("DSsd");
    // function reverseString(strdatescdule) {
    var splitString = strdatescdule.split("-");
    var reverseArray = splitString.reverse();
    var joinArray = reverseArray.join("-");

    var dateSchedule = joinArray + " " + strtimeschdule;

    var connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      port: 3307,
      password: "",
      database: "ailbazco_db",
    });

    connection.connect();

    connection.query(
      "SELECT schedule_at  FROM user_requests WHERE user_id = ? and schedule_at IS NOT NULL",
      [data.id],
      function (error, results, fields) {
        if (!error) {
          if (results.length == 0) {
            ifCondetionScdule(null);
          } else {
            ifCondetionScdule(results[0].schedule_at);
          }

          return results;
        } else {
          console.log(error);
          return error;
        }
      }
    );

    connection.end();

    function ifCondetionScdule(datas) {
      console.log(datas);
      if (datas == null) {
        console.log({ servicetype: data });
        var connection = mysql.createConnection({
          host: "localhost",
          user: "root",
          port: 3307,
          password: "",
          database: "ailbazco_db",
        });

        connection.connect();
        connection.query(
          "INSERT INTO" +
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
            "'" +
            dateSchedule +
            "'" +
            "," +
            "'" +
            data.booking_id +
            "'" +
            "," +
            "'" +
            data.id +
            "'" +
            "," +
            "'" +
            data.id +
            "'" +
            "," +
            "'" +
            data.service_type +
            "'" +
            "," +
            "'SCHEDULED'" +
            "," +
            "'" +
            data.payment_mode +
            "'" +
            "," +
            "'" +
            data.distance +
            "'" +
            "," +
            "'" +
            data.s_address_ar +
            "'" +
            "," +
            "'" +
            data.s_address_en +
            "'" +
            "," +
            "" +
            data.s_latitude +
            "" +
            "," +
            "" +
            data.s_longitude +
            "" +
            "," +
            "'" +
            data.d_address_ar +
            "'" +
            "," +
            "'" +
            data.d_address_en +
            "'" +
            "," +
            "" +
            data.d_latitude +
            "" +
            "," +
            "" +
            data.d_longitude +
            ")",
          (error, results, fields) => {
            if (!error) {
              refechUserLogin(data.id);
              console.log("schudual trip and this data", results);
              // return inserts.push(results)
              return results;
              // res.push(results);
            } else {
              console.log(error);
              return error;
            }
          }
        );

        connection.end();
        checkescduletrip("done", data);
      } else {
        checkescduletrip("false", data);
      }
    }

    function checkescduletrip(data, datas) {
      console.log({ datas: datas });
      var obj = "";
      if (data == "done") {
        obj = {
          schedule: {
            schedule_date: datas.schedule_date,
            schedule_time: datas.schedule_time,
            message: "is done",
            status: "1",
          },
          request: {
            datas,
          },
        };
        Clientss[datas.id].emit("confirm_save_schedule_trip", obj);
      } else {
        var obj = {
          schedule: {
            schedule_date: datas.schedule_date,
            schedule_time: datas.schedule_time,
            message: "is dont save",
            status: "0",
          },
          request: {
            datas,
          },
        };

        Clientss[datas.id].emit("confirm_save_schedule_trip", obj);
      }
    }
  });

  socket.on("confirm_schedule_trip", function (status) {
    console.log("confirm_schedule_trip event", status);
    if (status.confirm == "0") {
      /////connect to my sqli
      var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        port: 3307,
        password: "",
        database: "ailbazco_db",
      });
      connection.connect();
      connection.query(
        " UPDATE user_requests SET   status =  " +
          '"CANCELLED"' +
          "," +
          " updated_at =" +
          "  NOW() " +
          "," +
          " schedule_at =" +
          "NULL" +
          " WHERE id = " +
          "'" +
          status.Trip_id +
          "'" +
          "   ",
        (error, results, fields) => {
          if (!error) {
            console.log(results);
            return results;
          } else {
            console.log(error);
            return error;
          }
        }
      );

      connection.end();
    } else if (status.confirm == "1") {
      var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        port: 3307,
        password: "",
        database: "ailbazco_db",
      });
      connection.connect();
      connection.query(
        "SELECT user_requests.*, users.* ,user_requests.id as tripid  FROM user_requests INNER JOIN users ON user_requests.user_id=users.id where user_requests.id = ?  ",
        [status.Trip_id],
        (error, results, fields) => {
          if (!error) {
            console.log(results[0]);
            // return inserts.pus(results);
            var objj = JSON.stringify(results[0]);
            objj.Trip_id = status.Trip_id;
            console.log("data must be coorect", objj);

            setdatas(objj);
            return results;
            // res.push(results);
          } else {
            console.log(error);
            return error;
            //   inserts.push(results);
          }
        }
      );

      connection.query(
        "UPDATE user_requests SET schedule_at= NULL ,  updated_at = ?  WHERE id = ? ",
        [new Date(), status.Trip_id],
        (error, results, fields) => {
          if (!error) {
            return results;
            // res.push(results);
          } else {
            console.log(error);
            return error;
          }
        }
      );
      connection.end();
    }
  });

  socket.on("cancel_trip_user", function (datas) {
    // Tri
    console.log(" cancel event from user ", datas);

    if (
      (datas.provider_id == "0" || datas.provider_id == "") &&
      datas.Trip_id == "0"
    ) {
      if (datas.client_id != "" && datas.client_id != "0") {
        datas.Trip_id = Requests["Request" + datas.client_id].request.Trip_id;
      }
      var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        port: 3307,
        password: "",
        database: "ailbazco_db",
      });

      connection.connect();
      // reason
      connection.query(
        " UPDATE user_requests SET   status =  " +
          '"CANCELLED"' +
          "," +
          " updated_at =" +
          "  NOW() " +
          "," +
          " cancelled_by = " +
          "'USER'" +
          "," +
          " cancel_reason =" +
          "'" +
          datas.reason +
          "'" +
          " WHERE id = " +
          "'" +
          datas.Trip_id +
          "'" +
          "   ",
        (error, results, fields) => {
          if (!error) {
            console.log(results);
            return results;
          } else {
            console.log(error);
            return error;
          }
        }
      );

      connection.end();
      delete Requests["Request" + datas.client_id];
      if (datas.client_id != "" && datas.client_id != "0") {
        Clientss[datas.client_id].broadcast.emit("start_not_confirm", {
          Trip_id: datas.Trip_id,
        });
      }
    } else {
      var connection = mysql.createConnection({
        host: "localhost",
        user: "root",
        port: 3307,
        password: "",
        database: "ailbazco_db",
      });

      connection.connect();
      // reason
      connection.query(
        " UPDATE user_requests SET   status =  " +
          '"CANCELLED"' +
          "," +
          " updated_at =" +
          "  NOW() " +
          "," +
          " cancelled_by = " +
          "'USER'" +
          "," +
          " cancel_reason =" +
          "'" +
          datas.reason +
          "'" +
          " WHERE id = " +
          "'" +
          datas.Trip_id +
          "'" +
          "   ",
        (error, results, fields) => {
          if (!error) {
            console.log(results);
            return results;
          } else {
            console.log(error);
            return error;
          }
        }
      );

      connection.end();
      delete Requests["Request" + datas.client_id];
      if (datas.provider_id != "0" && datas.provider_id != "") {
        Providerss[datas.provider_id].emit("cancel_trip_provider", {
          Trip_id: datas.Trip_id,
          provider_email: "admin@ali.com",
        });
      }
    }
  });

  socket.on("disconnect", function () {
    console.log("disconnect", socket.id);
    for (var clientttt in Clients) {
      if (Clients.hasOwnProperty(clientttt)) {
        console.log("one socket", Clients[clientttt].socket_id);
        if (Clients[clientttt].socket_id == socket.id) {
          delete Clients[clientttt];
        }
      }
    }

    for (var Providerrrrrr in Providers) {
      if (Providers.hasOwnProperty(Providerrrrrr)) {
        console.log("one socket", Providers[Providerrrrrr].socket_id);
        if (Providers[Providerrrrrr].socket_id == socket.id) {
          delete Providers[Providerrrrrr];
          DeleteFromRequestedProvider(Providerrrrrr);
        }
      }
    }
    console.log("Providers after deleted ", Providers);
    console.log("Clients after deleted ", Clients);
  });
});

function refechUserLogin(uer_trip_id) {
  console.log("inside refechUserLogin method ");
  var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    port: 3307,
    password: "",
    database: "ailbazco_db",
  });
  connection.connect();

  connection.query(
    "SELECT user_requests.*, users.* ,user_requests.id as tripid    FROM user_requests INNER JOIN users ON user_requests.user_id=users.id where  user_id = ? and schedule_at IS NOT NULL ORDER BY user_requests.id DESC LIMIT 1",
    [uer_trip_id],
    function (error, results, fields) {
      if (!error) {
        if (results.length == 0) {
          console.log("result get data from data base  is null");
          setvaluedatescdule(null);
        } else {
          console.log("result get data from data base ", results[0]);
          console.log("current_schedule_trip befor method", results[0].id);
          setvaluedatescdule(
            results[0].schedule_at.toLocaleString(),
            results[0].tripid,
            results[0].s_address_ar,
            results[0].s_address_en,
            results[0].d_address_ar,
            results[0].d_address_en,
            results[0].mobile,
            results[0].email,
            results[0].id
          );
        }
      } else {
        console.log(error);
        return error;
        //   inserts.push(results);
      }
    }
  );
  connection.end();
}

function settripid(data, datas) {
  data.request.rejectedProviders = [];
  data.request.Trip_id = datas;
  Requests["Request" + data.UserId] = data;
  SendRequest(Requests["Request" + data.UserId]);
}

function setValues(data) {
  // console.log(data);
  requestClient[data.id] = data;
}

function setvaluedatescdule(
  data,
  tripid,
  s_address_ar,
  s_address_en,
  d_address_ar,
  d_address_en,
  moboile,
  email,
  user_ididid
) {
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
    console.log([tirmsubcurrentdateTime, tirmsubscduledateTime]);
    var strlengthsubcurrentdatehour = subcurrentdatehour.toString();
    var strlengthsubscduledatehour = subscduledatehour.toString();
    if (
      (tirmsubcurrentdateTime == "PM" && tirmsubscduledateTime == "PM") ||
      (tirmsubcurrentdateTime == "AM" && tirmsubscduledateTime == "AM")
    ) {
      if (subcurrentdatehour == 12) {
        subcurrentdatehour = 0;
      }
      if (subscduledatehour == 12) {
        subscduledatehour = 0;
      }
    } else if (
      (tirmsubcurrentdateTime == "PM" && tirmsubscduledateTime == "AM") ||
      (tirmsubcurrentdateTime == "AM" && tirmsubscduledateTime == "BM")
    ) {
      if (tirmsubcurrentdateTime == "PM" && tirmsubscduledateTime == "AM") {
        if (
          strlengthsubcurrentdatehour.length == 2 &&
          strlengthsubscduledatehour.length == 1
        ) {
          subscduledatehour += 12;
        } else if (
          strlengthsubcurrentdatehour.length == 1 &&
          strlengthsubscduledatehour.length == 2
        ) {
          subcurrentdatehour += 12;
        }
      } else if (
        tirmsubcurrentdateTime == "AM" &&
        tirmsubscduledateTime == "BM"
      ) {
        if (
          strlengthsubcurrentdatehour.length == 2 &&
          strlengthsubscduledatehour.length == 1
        ) {
          subscduledatehour += 12;
        } else if (
          strlengthsubcurrentdatehour.length == 1 &&
          strlengthsubscduledatehour.length == 2
        ) {
          subcurrentdatehour += 12;
        }
      }
    }

    console.log([
      { subscduledatehour: subscduledatehour },
      { subscduledatehour: subscduledatehour },
    ]);

    if (subcurrentdate === subscduledate) {
      if (subcurrentdatehour + 1 == subscduledatehour) {
        var date = scduledate.toLocaleString().substr(0, 9);
        var time = scduledate.toLocaleString().substr(10, 11);
        var obj = {
          schedule: {
            Trip_id: tripid,
            schedule_date: date,
            schedule_time: time,
            s_address_ar: s_address_ar,
            d_address_ar: d_address_ar,
            s_address_en: s_address_en,
            d_address_en: d_address_en,
          },
          request: {
            moboile: moboile,
            email: email,
          },
        };

        console.log("current_schedule_trip", user_ididid);
        Clientss[user_ididid].emit("current_schedule_trip", obj);
      }
    }
  }
}

function setdatas(data) {
  console.log("new data to test  in side setdatas metod", JSON.parse(data));
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
    rejectedProviders: [],
  };

  var datarequest = { request: datasrequest };
  requestScduleTrip = datarequest;
  requestScduleTrip.UserId = datas.id;
  console.log("salmonila");
  console.log(requestScduleTrip);
  Requests["Request" + datas.id] = requestScduleTrip;

  SendRequest(Requests["Request" + datas.id]);
}

function SendRequest(Data) {
  console.log("SendRequest to providers all providers are", Providers);

  for (var Provider in Providers) {
    if (
      RequestedProviders.indexOf(Provider) <= -1 &&
      Data.request.rejectedProviders.indexOf(Provider) == -1 &&
      Data.request.rejectedProviders.includes(parseInt(Provider)) == false
    ) {
      var requestLatitude = Data.request.s_latitude,
        requestLongitude = Data.request.s_longitude,
        providerLatitude = Providers[Provider].lat,
        providerLongitude = Providers[Provider].long,
        provider_service = Providers[Provider].provider_service,
        providerRange = Providers[Provider].range;

      if (
        getDistanceFromLatLonIMm(
          providerLatitude,
          providerLongitude,
          requestLatitude,
          requestLongitude
        ) <= providerRange &&
        Data.request.service_type == provider_service
      ) {
        console.log("Send to one provider this data", Data);
        emitOn(io, "request_range", Data, Providers[Provider].socket_id);
        RequestedProviders.push(Provider);
      }
    }
  }
}

function DeleteFromRequestedProvider(Provider) {
  if (RequestedProviders.indexOf(Provider) > -1) {
    RequestedProviders.splice(RequestedProviders.indexOf(Provider), 1);
  }
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
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

Object.size = function (obj) {
  var size = 0,
    key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};
