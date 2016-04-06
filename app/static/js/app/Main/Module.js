define([ "App", "marionette", "Main/Controller", "collections/RaceCollection" ], 
	function(App, Marionette, MainController, RaceCollection ){

		var Main = App.module("Main");

		Main.startWithParent = true;

		Main.filterCollection = function(filter, filter_values) {
		   if(!filter) return Main.races;
		   return Main.races.byFilter(filter,filter_values);
		};

		Main.addInitializer(function(options){
			Main.races = new RaceCollection(options.races);

			App.reqres.setHandler('getRaceCollection', Main.filterCollection);

			// @todo: envisager un controller dédié à la gestion du filtering ? Module Races ?
			this.listenTo(App.vent, "dash:race:add", function(){ App.options.filter = "dashed"; App.options.filter_values = ""; });
			this.listenTo(App.vent, "dash:race:remove", function(){ App.options.filter = "dashed"; App.options.filter_values = ""; });

			this.controller = new MainController({
			    mainRegion: App.mainRegion,
			    races: Main.races,
			    filter: options.filter,
			    filter_values: options.filter_values
			});

		});

		Main.addFinalizer(function(){
			console.log("on ferme Main");
		});

		return Main;
	});	