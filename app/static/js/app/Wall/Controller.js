define(['Wall', 'backbone', 'marionette', 'Wall/LayoutWall', 'Wall/Ping/PingView'],
	function (App, Backbone, Marionette, LayoutWall, PingView) {

		return Marionette.Controller.extend({

			initialize: function(){
				this.current_race = App.getOption('current_race');
				var globalCh = Backbone.Wreqr.radio.channel('global');

				globalCh.vent.on('socket:connected', this._connecting, this);
				globalCh.vent.on('socket:disconnected', this._disconnecting, this);
				globalCh.vent.on('remote:ping', this._ping, this);
				globalCh.vent.on('remote:gotourl', this._go_to, this);
				globalCh.vent.on('theme:updated', this._refresh, this);
				// globalCh.vent.on('race:updated:'+this.current_race, this.updateRace, this);
			},

			index: function(){
				console.log("pas de route côté serveur");
			},
			
			wall: function (race_id) {
				console.log("du coup on a: ", race_id);
				var layout = new LayoutWall({race_id: this.current_race});
				App.rootView.main.show(layout);
			},

			_refresh: function(){
				/*
				WARN BUG Firefox
				Si l'onglet d'un wall n'a pas le focus lors de la relecture de la page (qu'il soit ou non dans la fenêtre principale)
				le refresh plantera invariablement sur une tentative de fetch de la race + collection "à vide" (sans id pour la race)
				alors que tout se passera sans douleur si l'onglet du wall à le focus (qu'il soit visible en gros)
				L'effet est donc le même dans une 2ème fenêtre si on s'amuse à ouvrir un autre onglet en // du wall
				*/
				App.sck.socket.emit('leave', 'play_'+this.current_race);
				window.location.replace( window.location.href );
			},

			_go_to: function(url){
				App.sck.socket.emit('leave', 'play_'+this.current_race);
				window.location.replace( url );
			},

			_ping: function(sessid){
			    var ping = new Backbone.Model({message: sessid});
			    App.rootView.showChildView('visualPing', new PingView({model: ping}));
			    setTimeout(function(){
			        App.rootView.getRegion('visualPing').empty();
			    }, 5000);
			},

			_connecting: function(){
			    var ping = new Backbone.Model({message: 'Connecté !!'});
			    App.rootView.getRegion('visualPing').show( new PingView({model: ping}) );
			    App.sck.socket.emit('join_only', 'play_'+this.current_race);
			    setTimeout(function(){
			        App.rootView.getRegion('visualPing').empty();
			    }, 5000);
			},

			_disconnecting: function(data){
			    console.log("_disconnecting: %o", data);
			    var ping = new Backbone.Model({message: 'Connexion ...'});
			    App.rootView.getRegion('visualPing').show( new PingView({model: ping}) );
			}

		});

	});