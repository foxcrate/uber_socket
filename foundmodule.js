// var server = require('express')
// var app = server()
// var uuid = require('uuid/v4')
// var event = require('events')
// class myevent extends event {
//     log(msg){
//         this.emit('click' , {massage:msg  , id:uuid()})
//     }
// }



// module.exports = myevent





// var port = process.env.port || 3000
// app.listen(port , ()=>console.log(`app is listining to port ${port}`))
// const port = process.env.port || 3000
// const app = require('express')()
// const server = require('http').createServer(app)
// const io = require('socket.io')(server)
// io.on('connect' , ()=>{'connected'})
// server.listen(port)
// io.emit('connect')

console.log('hello')

const user = require('./index')
const eventuser = new user()

eventuser.on('click' , data=>Console.log('user ' , data))
eventuser.log('hello')













