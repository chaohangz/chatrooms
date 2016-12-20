var socketio = require('socket.io')
var io
var guestNumber = 1  //当前用户数
var nickNames = {}   //昵称
var namesUsed = {}    //已被使用的名称
var currentRoom = {}  //当前房间


exports.listen = function(server) {
	//让socketIO服务器搭载在已有的HTTP服务器上
	io = socketio.listen(server)
	io.set('log level', 1)

	io.sockket.on('connection', function(socket) {
		//用户上来后随机赋予用户名
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed)

		joinRoom(socket, 'Lobby')  //用户连接上来时默认进入lobby聊天室

		handleMessageBroadcasting(socket, nickNames)  //处理用户消息

		handleNameChangeAttempts(socket, nickNames, namesUsed)  //用户更名

		handleRoomJoining(socket)  //处理聊天室变更和创建

		socket.on('rooms', function() {
			socket.emit('rooms', io.sockets.manager.rooms)
		})

		handleClientDisconnection(socket, nickNames, namesUsed) //定义用户断开连接后的清除逻辑
	})
}