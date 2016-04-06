require.config({
	baseUrl: '/static/js/app/',
	noGlobal: true,
	paths: {
		// Core Libraries
		jquery: 				"../vendor/jquery.min",
		lodash: 				"../vendor/lodash.min",
		backbone: 				"../vendor/backbone.min",
		marionette: 			"../vendor/backbone.marionette.min",
		bootstrap: 				"../vendor/bootstrap.min",
		socketio: 				"../vendor/socket.io.min",
		moment: 				"../vendor/moment.min",

		// Plugins
		'backbone.wreqr': 		"../vendor/backbone.wreqr.min",
		'backbone.babysitter': 	"../vendor/backbone.babysitter.min",
		'moment.fr': 			"../vendor/fr.min",
		text: 					"../vendor/text.min",
		'twitter-text': 		"../vendor/twitter-text.min"
	},
	shim: {
		bootstrap: ["jquery"],
		marionette: {
		    deps: ["underscore", "backbone", "backbone.wreqr", "backbone.babysitter", 
		            "jquery", "twitter-text"],
		    exports: "Marionette"
		},
		socketio: {
		    exports: "io"
		}
	},
    map: {
        '*': {underscore: 'lodash'}
    }
});

define('options', {
	current_race: window.current_race,
	settings: window.settings,
	stream_status: window.stream_status,
	level: window.level,
	// @todo: revoir les options modale, servent pê en admin mais à priori pas dans les clients
	// @size: classname pour la taille de la modale (de l'admin)
	// normal : '' | small : 'modal-sm' | large : 'modal-lg'
	optionsModale: {
	    small: {size: 'bidibule', text: true, media: false},
	    large: {size: 'modal-lg', text: false, media: true}
	}
});

require(['Wall', 'options', 'Wall/Router', 'Wall/Controller', 'jquery', 'bootstrap'], 
	function (App, options, Router, Controller) {

		App.options = options;
		App.appRouter = new Router({
			controller: new Controller(options)
		});
		App.start(options);

	});