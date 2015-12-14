var sockets = {};

chrome.extension.onMessage.addListener(function(request, sender, callback) {
	if (!sender.hasOwnProperty('tab')) {
		return;
	}
	
	if (request.action === "get_server_info") {		
		var socket = new MiqiClient("ws://127.0.0.1:54321", function(message) {
			if (callback) {
				message.headers['Key'] = sockets[sender.tab.id].key;
				callback(message.toString());
			}
		}, function(message) {
			var bytes = CryptoJS.AES.decrypt(message.headers["Password"], sockets[sender.tab.id].key);
			message.headers["Password"] = bytes.toString(CryptoJS.enc.Utf8);
			chrome.tabs.sendMessage(sender.tab.id, {action: "set_credential", message: message});
		});
		
		sockets[sender.tab.id] = {
			socket: socket,
			key: "" + Math.round(Math.random() * 100000000)
		};
		
		socket.connect();
		
		if (callback) {
			// let the callback work in async mode.
			return true;
		}
	} else if (request.action === "close_connection") {
		sockets[sender.tab.id].socket.disconnect();
		delete sockets[sender.tab.id];
	}
});
