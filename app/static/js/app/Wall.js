define(['jquery', 'backbone', 'marionette', 'underscore', 'options', 'Wall/sio', 'Modal/Region'],
	function ($, Backbone, Marionette, _, options, sio, ModalRegion) {

		if(!window.debugging){
		    console = {};
		    console.log = function(){};
		}

		App = new Marionette.Application();

		var RootView = Marionette.LayoutView.extend({
		    el: 'body',
		    regions: {
		        main: "#main",
		        visualPing: "#visualPing"
		    }
		});

		App.rootView = new RootView();

		// @todo: revoir les options modale, servent pê en admin mais à priori pas dans les clients
		// et l'injection des options semble purement décorative...
		App.rootView.addRegion('modalRegion', new ModalRegion(options.optionsModale));
		
		App.on('start', function (options) {
			if(!window.screenshot){
				App.sck = new sio();
			}
			Backbone.history.start({ pushState: true }, root= '/');
		});

		return App;
	});