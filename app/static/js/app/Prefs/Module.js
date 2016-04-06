// define([ "App", "marionette", "Prefs/Controller"], 
// 	function(App, Marionette, ColMenuController){
	define([ "App", "marionette","Prefs/General/Model"], 
	function(App, Marionette, PrefsModel){
		var Prefs = App.module("Prefs");

		Prefs.startWithParent = true;

		Prefs.addInitializer(function(settings){
			// this.controller = new ColMenuController({
			//     mainRegion: App.mainRegion,
			// });

			this.Generales = new PrefsModel(settings);

		    $.embedly.defaults.key = this.Generales.get('embedly_key');

		    var that = this;
		    App.reqres.setHandler('getPref', function(key) {
		    	// Usage :
		    	// App.request('getPref','embedly_key');
		        var bt = that.Generales.get(key);
		        // console.log("Prefs reqres: '%s' : %o",key, bt);
		       return bt;
		    });

		    this.listenTo(App.vent, "prefs:updated", function(data){
		        this.Generales.set(data);
		        if(this.Generales.hasChanged("title")) {
		            App.vent.trigger("prefs:updated:title", data);
		        }
		        if(this.Generales.hasChanged("retweet")) {
		            App.vent.trigger("stream:restart:required", {action: "Race start demand"});
		        }
		        if(this.Generales.hasChanged("embedly_key")) {
		            $.embedly.defaults.key = this.Generales.get('embedly_key');
		        }
		    });

		});

		Prefs.addFinalizer(function(){
			// App.mainRegion.empty();
			console.log("on ferme Prefs");
		});

		return Prefs;
	});	