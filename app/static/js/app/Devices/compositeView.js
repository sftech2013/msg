define([ 'App', 'marionette', 'underscore', 'Devices/collection', 'Devices/deviceLayout', 'text!Devices/devices-list.html'], 
	function(App, Marionette, _, DeviceColl, deviceLayout, tplDevicesList){

		return Marionette.CompositeView.extend({
			template: _.template(tplDevicesList),
			childViewContainer: ".container-devices",
			childView: deviceLayout,
			// className: 'section',

			initialize: function(options){
				// passage de la Racecollection à chaque deviceLayout 
				// pour ne pas avoir à fetcher pour chaque entrée
				this.childViewOptions = {
					racecollec: options.racecollec,
					server_info: options.server_info
				}

				// @todo: fusionner ces events
				this.listenTo(App.vent, 'device:waiting:inc', this.onConnected);
				this.listenTo(App.vent, 'device:wall:join', this.onConnected);

				this.listenTo(App.vent, 'device:disconnected', this.onDisconnected);
				this.listenTo(App.vent, 'device:wall:leave', this.onLeave);
				this.listenTo(App.vent, 'device:waiting:dec', this.onLeave);

				App.commands.setHandler("sendDevice", function(device_id, wallurl){
					App.socket.emit("send_device_to", device_id, wallurl);
				});
			},

			onConnected: function(data){
				d = this.collection.where({id: data.id});
				// console.log(d);
				if(d.length == 1){
					console.log("déjà présent %o", d[0]);
					d[0].set(data);
				}else{
					this.collection.add(data);
				}
			},

			onLeave: function(data){
				console.log("leaving a room: %o", data);
				this.collection.remove({id: data.id});
			},

			onDisconnected: function(data){
				console.log("peut être quelque chose à faire ? %o", data);
			}

			// @verif: ne doit plus servir
			// refreshList: function(data){
			// 	// @todo: trouver une solution pour récupérer 'au vol' le sessid socketio
			// 	// et ne pas avoir à fetcher les Devices connectés
			// 	console.log("before le fetch: ", data);
			// 	this.collection.fetch();
			// },

		});

	});