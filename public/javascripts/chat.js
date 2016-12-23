//定义 Chat 类，及Chat类中包含的方法

var Chat = function(socket) {
	this.socket = socket
}


//发送信息
Chat.prototype.sendMessage = function(room, text) {
	var message = {
		room: room,
		text: text
	}
	this.socket.emit('message', message)
}

//变更房间
Chat.prototype.changeRoom = function(room) {
	this.socket.emit('join', {
		newRoom: room
	})
}


//处理join和nick命令
Chat.prototype.processCommand = function(command) {
	var words = command.split(' ')
	var	command = words[0]
									.substring(1, words.length)
									.toLowerCase()
	var message = false

	switch(command) {
		case 'join':
			words.shift()  //删除该命令
			var room = words.join(' ')  //把数组转化成字符串，并加入分割符
			this.changeRoom(room)
			break
		case 'nick':
			words.shift()
			var name = words.join(' ')
			this.socket.emit('nameAttempt', name)
			break
		default:
			message = 'Unrecognized command.'
			break
	}

	return message
}