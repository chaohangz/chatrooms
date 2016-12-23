var socketio = require('socket.io')
var io
var guestNumber = 1  //当前用户数
var nickNames = {}   //昵称
var namesUsed = []    //已被使用的名称
var currentRoom = {}  //当前房间


exports.listen = function(server) {
	//让socketIO服务器搭载在已有的HTTP服务器上
	io = socketio.listen(server)
	io.set('log level', 1)   //长连接

	io.sockets.on('connection', function(socket) {

		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed)   //用户上来后随机赋予用户名

		joinRoom(socket, 'Lobby')  //用户连接上来时默认进入lobby聊天室

		handleMessageBroadcasting(socket, nickNames)  //处理用户消息

		handleNameChangeAttempts(socket, nickNames, namesUsed)  //用户更名

		handleRoomJoining(socket)  //处理聊天室变更和创建

		socket.on('rooms', function() {
			socket.emit('rooms', io.of('/').adapter.rooms)  //不明白
		})

		handleClientDisconnection(socket, nickNames, namesUsed) //定义用户断开连接后的清除逻辑
	})
}


function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
	var name = "Guest" + guestNumber
	nickNames[socket.id] = name
	socket.emit('nameResult', {
		success: true,
		name: name
	})
	namesUsed.push(name)
	return guestNumber++   //guestNumber不是全局变量吗，为什么还要返回
}


function joinRoom(socket, room) {
	socket.join(room)   //不明白
	currentRoom[socket.id] = room
	socket.emit('joinResult', {room: room})        //向建立该链接的客户端广播
	socket.broadcast.to(room).emit('message', {  //socket.broadcast.emit 向除去建立该链接的客户端的所有用户广播
		text: nickNames[socket.id] + "has joined" + room + "."
	})

	//汇总当前room其他用户发送给这个用户
	var usersInRoom = io.of('/').in(room).clients //不明白
	if (usersInRoom.length > 1) {
		var usersInRoomSummary = 'Users currently in ' + room + ': '
		for (var i in usersInRoom) {
			var userSocketId = usersInRoom[i].id //不明白
			if (userSocketId !== socket.id) {
				if (i > 0) {
					usersInRoomSummary += ","
				}
				usersInRoomSummary += nickNames[userSocketId]
			}
		}
		usersInRoomSummary += '.'
		socket.emit('message', {text: usersInRoomSummary})
	}
}


//更名
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
	socket.on('nameAttempt', function(name) {
		if (name.indexOf('Guest') === 0) {
			socket.emit('nameResult', {
				success: false,
				message: 'Names cannot begin with Guest'
			})
		} else {
			if (namesUsed.indexOf(name) === -1) {
				var previousName = nickNames[socket.id]
				var previousNameIndex = namesUsed.indexOf(previousName)
				namesUsed.push(name)
				nickNames[socket.id] = name
				delete namesUsed[previousNameIndex]
				socket.emit('nameResult', {
					success: true,
					name: name
				})
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
					text: previousName + "is now known as " + name + '.'
				})
			} else {
				socket.emit('nameResult', {
					success: false,
					message: 'that name is already in use.'
				})
			}
		}
	})
}


//发送消息
function handleMessageBroadcasting(socket, nickNames) {
	socket.on('message', function(message) {
		socket.broadcast.to(message.room).emit('message', {
			text: nickNames[socket.id] + ": " + message.text
		})
	})
}


//切换房间
function handleRoomJoining(socket) {
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.id])  //不明白
		joinRoom(socket, room.newRoom)
	})
}


//离开房间
function handleClientDisconnection(socket) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id])
		delete namesUsed[nameIndex]
		delete nickNames[socket.id]
	})
}