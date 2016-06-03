var fs = require("fs");
var Helper = require("./helper");

function oidentdFile(file) {
	this.file = Helper.expandHome(file);
	this.connectionId = 0;
	this.connections = {};

	this.refresh();
}

oidentdFile.prototype = {
	hookSocket: function(socket, user) {
		var that = this;
		var id = null;

		socket.on("connect", function() {
			id = that.addSocket(socket, user);
			that.refresh();
		});
		socket.on("close", function() {
			that.removeConnection(id);
			that.refresh();
		});
	},

	addSocket: function(socket, user) {
		var id = this.connectionId++;
		this.connections[id] = {socket: socket, user: user};
		return id;
	},

	removeSocket: function(socket) {
		for (var id in this.connections) {
			if (this.connections[id] === socket) {
				delete this.connections[id];
				break;
			}
		}
	},

	removeConnection: function(id) {
		delete this.connections[id];
	},

	getSockets: function() {
		return this.connections;
	},

	refresh: function() {
		var file = "# Warning: file generated by The Lounge: changes will be overwritten!\n";

		function makeRule(connection) {
			return  "to " + connection.socket.remoteAddress
				+ " lport " + connection.socket.localPort
				+ " from " + connection.socket.localAddress
				+ " fport " + connection.socket.remotePort
				+ " { reply \"" + connection.user + "\" }\n";
		}

		for (var id in this.connections) {
			file += makeRule(this.connections[id]);
		}

		fs.writeFile(this.file, file, {flag: "w+"}, function(err) {
			if (err) {
				log.error("Failed to update oidentd file!", err);
			}
		});
	},
};

module.exports = oidentdFile;
