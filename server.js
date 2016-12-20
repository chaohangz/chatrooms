var http = require('http')
var fs = require('fs')
var path = require('path')
var mime = require('mime')
var cache = {} //缓存文件内容的对象
var chatServer = require('./lib/chat_server')

//错误响应
function send404(response) {
	response.writeHead(404, {'Content-Type': 'text/plain'})
	response.write('Error 404: resource not found.')
	response.end()
}

//发送文件内容
function sendFile(response, filePath, fileContents) {
	response.writeHead(
		200,
		{"content-type": mime.lookup(path.basename(filePath))}
	)
	response.end(fileContents)
}

//判断文件在内存中还是硬盘中或者不存在
function serverStatic(response, cache, absPath) {
	if (cache[absPath]) {
		sendFile(response, absPath, cache[absPath])
	} else {
		fs.exists(absPath, function(exists) {
			if (exists) {
				fs.readFile(absPath, function(err, data) {
					if (err) {
						send404(response)
					} else {
						cache[absPath] = data
						sendFile(response, absPath, data)
					}
				})
			} else {
				send404(response)
			}
		})
	}
}


//创建HTTP服务器
var server = http.createServer(function(request, response) {
	var filePath = false;

	if (request.url === '/') {
		filePath = 'public/index.html'
	} else {
		filePath = 'public' + request.url
	}
	var absPath = './' + filePath
	serverStatic(response, cache, absPath)
})

server.listen(3000, function() {
	console.log('server listening on port 3000')
})


//启动Socket.IO服务器
//为它提供已经定义好的HTTP服务器
//这样它就能跟HTTP服务器共享同一个TCP/IP
chatServer.listen(server)