//用户输入时不可信任的
//使用text把所有的输入解析为文本信息
//避免输入脚本信息攻击
function divEscapedContentElement(message) {
	return $('<div></div>').text(message)   //新建div元素
}

//系统输入可信，使用html写入
function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message + '</i>')
}


//处理用户输入
function processUserInput(chatApp, socket) {
	var message = $('#send-message').val()
	var systemMessage

	if (message.charAt(0) === "/") {
		systemMessage = chatApp.processCommand(message)
		if (systemMessage) {
			$('#messages').append(divSystemContentElement(systemMessage))
		}
	} else {
		chatApp.sendMessage($('#room').text(), message)
		$('#messages').append(divEscapedContentElement(message))
		$('#messages').scrollTop($('#messages').prop('scrollHeight'))  //把滚动条拉到底部
	}

	$('#send-message').val('')
}

var socket = io.connect()

$(document).ready(function () {
	var chatApp = new Chat(socket)

	socket.on('nameResult', function(result) {
		var message

		if (result.success) {
			message = "You are now known as " + result.name + "."
		} else {
			message = result.message
		}
		$('#messages').append(divSystemContentElement(message))
	})

	socket.on('joinResult', function(result) {
		$('#room-list').text(result.room)
		$('#message').append(divSystemContentElement('change room'))
	})

	socket.on('message', function(message) {
		var newElement = $('<div></div>').text(message.text)  //新建div元素
		$('#messages').append(newElement)
	})

	socket.on('rooms', function(rooms) {
		$('#room-list').empty()  //清空

		for (var room in rooms) {
			room = room.substring(1, room.length)
			if (room !== '') {
				$('#room-list').append(divEscapedContentElement(room))
			}
		}

		//点击房间列表发出join命令
		$('#room-list div').click(function() {
			chatApp.processCommand('/join ' + $(this).text())
			$('#send-message').focus()
		})
	})


	//定时请求可用房间列表
	setInterval(function() {
		socket.emit('rooms')
	}, 1000)

	$('#send-message').focus()

	$('#send-form').submit(function() {
		processUserInput(chatApp, socket)
		return false  //禁用按钮默认跳转功能
	})
})