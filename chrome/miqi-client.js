var MiqiClient = function(serverAddr, onGetServerInfoResp, onSetCredential) {

	var webSocket;

	return {
		connect: function(){
			webSocket = new WebSocket(serverAddr);

			webSocket.onopen = function(e) {
				console.log("open");
				this.send("GET-SERVER-INFO MIQI/1.0");
			};

			webSocket.onmessage = function(e){
				console.log("message");
				if(typeof e.data === "string") {
					var message = new MiqiMessage(e.data);
					if (message.command === "GET-SERVER-INFO-RESP") {
						if (onSetCredential) {
							onGetServerInfoResp(message);
						}
					} else if(message.command === "SET-CREDENTIAL") {
						if (onGetServerInfoResp) {
							onSetCredential(message);
						}
					}
				}
			};
			
			webSocket.onerror = function(e) {
				console.log("error");
			};

			webSocket.onclose = function(e) {
				console.log("disconnected");
			};
		},

		send: function(message) {
			if (!webSocket) {
				return;
			}
			
			if (webSocket.readyState != 1) {
				return;
			}
			
			webSocket.send(message);
		},
	
		disconnect: function(){
			if (webSocket) {
				webSocket.close();
			}
		},
	};
};

var MiqiMessage = function(response) {
	var commandv = '';
	var protocol = '';
	var headers = {};
	
	(function(response) {
		var i, temp;
		var lines;
		var line1;
		
		lines = response.split("\r\n");	
		if (lines.length > 0) {
			line1 = lines[0].split(" ");
			command = line1[0].toUpperCase();
			if (line1.length > 1) {
				protocol = line1[1];
			}
		}
		
		for (i = 1; i < lines.length; i++) {
			temp = lines[i].split(":");
			if (temp) {
				headers[temp[0]] = temp[1];
			}
		}
	})(response);
	
	return {
		command: command,
		protocol: protocol,
		headers: headers,
		toString: function() { return response; },
	};
};
