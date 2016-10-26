var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    cache = {};


//send 404 Error
function send404(response) {
    response.writeHead(404, {'Content-Type':'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
}

//send file
function sendFile(response, filePath, fileContents) {
    response.writeHead(
        200,
        {'Content-Type': mime.lookup(path.basename(filePath))}
    );
    response.end(fileContents);
}

//static files serve
function serveStatic(response, cache, absPath) {
    //check the file whether there is a cache
    if (cache[absPath]) {
        //return the file from the cache
        sendFile(response, absPath, cache[absPath]);
    } else {
        //check the file exists
        fs.exists(absPath, function(exists) {
            if (exists) {
                //if exists, read from the disk
                fs.readFile(absPath, function (err, data) {
                    if (err) {
                        send404(response);
                    } else {
                        //read from the disk and return
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    }
                });
            } else {
                send404(response);
            }
        });
    }
}


//creat HTTP server
var server = http.createServer(function(request, response) {
    var filePath = false;

    if (request.url == '/') {
        filePath = 'public/index.html';
    } else {
        //the URL path to the relative path
        filePath = 'public' + request.url;
    }

    var absPath = './' + filePath;
    serveStatic(response, cache, absPath);
});

server.listen(3000, function() {
    console.log("Server listening on port 3000.");
});













