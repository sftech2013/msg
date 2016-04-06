
define([ 'App', 'backbone', 'Themes/Model'],
    function( App, Backbone, ThemeModel) {

		return  Backbone.Collection.extend({
			model: ThemeModel,
			url: '/themes/',
			initialize: function(){
				// Il faudra peut etre en passer par là pour les widgets type dropDown list menu
				// new Backbone.SingleChooser(this);
			}
		});

    });