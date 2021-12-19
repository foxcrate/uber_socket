

 connection.query('select car_id from providers ' +
 ' WHERE id = ' +
 "'" + data.response.id + "'" +
 '', (error, results1, fields) => {

     if (!error) {
         console.log("data has been updated after driver data provider---------------------------------", results1);
         data.response.car_id=results1;
     } else {
         console.log(error)
         return error;
     }
 });

 console.log("----------------------------------------------------",  data.response.car_id);


 connection.query('select car_id from providers ' +
 ' WHERE id = ' +
 "'" + data.response.id + "'" +
 '', (error, results1, fields) => {

     if (!error) {
         console.log("data has been updated after driver data provider---------------------------------", results1);
         return results1;
     } else {
         console.log(error)
         return error;
     }
 });





























connection.query('select car_left from cars ' +
' WHERE id = ' +
"'" + results1 + "'" +
'', (error, results, fields) => {

    if (!error) {
        console.log("data has been updated after driver data provider---------------------------------", results);
      //  return results2;
    } else {
        console.log(error)
        return error;
    }
});














////////////////////////////////////////////////////////////////
connection.query('select * from providers ' +
' WHERE id = ' +
"'" + data.response.id + "'" +
'', (error, results1, fields) => {

    if (!error) {
        console.log(" data provider---------1--",results1[0].car_id);
        retValue =results1[0].car_id;
    } else {
        console.log(error)
        return error;
    }



});

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
             console.log("data has been updated after driver accepted-----------------------------2----", results);
            return results
        } else {
            console.log(error);
            return error;
        };

    });
    // connection.query('select * from cars WHERE id =56 ', (error, results2 ,fields) => {
        connection.query('SELECT * FROM cars ', (error, results2 ,fields) => {
        if (!error) {
            // for (var item in results2) {
               
            //     console.log('-----------------------------',item)
            // }
            if(retValue == 56){
                console.log("car_id",retValue);
            }
            
            console.log("data cars-------------------------------3--", results2);
             
        } else {
            console.log(error)
            return error;
        }



    });
