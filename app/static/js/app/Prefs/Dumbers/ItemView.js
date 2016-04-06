
define(['App', 'backbone', 'marionette', 'underscore', 'Prefs/Dumbers/Model', 'text!Prefs/Dumbers/dumber-item.html'],
	function(App, Backbone, Marionette, _, DumberModel, tplDumberItem) {

		var DumberItemView = Marionette.ItemView.extend({
		    model: DumberModel,
		    template: _.template(tplDumberItem),
		    tagName: 'li',
		    className: 'dumber-item list-group-item media',

		    ui: {
		    	btnCloser: ".closer"
		    },

		    events: {
		    	"click @ui.btnCloser": "removeDumber"
		    },

		    removeDumber: function(event){
		    	event.preventDefault();
		    	if( this.model.get('provider') == "TWITTER"){
		    	    // redémarrage du stream requis
		    	    App.vent.trigger("stream:restart:required", {action: "Dumber added demand"});
		    	}
		    	this.model.destroy();
		    	this.remove();
		    }
		});

		return DumberItemView;
	});