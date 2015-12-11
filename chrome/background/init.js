var sockets = {};

chrome.extension.onMessage.addListener(function(request, sender, callback) {
	if (!sender.hasOwnProperty('tab')) {
		return;
	}

	if (request.action === "get_server_info") {		
		var socket = new MiqiClient("ws://172.27.35.9:54321", function(message) {
			if (callback) {
				callback(message.toString());
			}
		}, function(message) {
			chrome.tabs.sendMessage(sender.tab.id, {action: "set_credential", message: message});
		});
		
		sockets[sender.tab.id] = socket;
		socket.connect();
		
		if (callback) {
			// let the callback work in async mode
			return true;
		}
	} else if (request.action === "close_connection") {
		sockets[sender.tab.id].disconnect();
		delete sockets[sender.tab.id];
	}
});
