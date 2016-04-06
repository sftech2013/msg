
define([ 'App', 'backbone', 'Themes/Nav/Model'],
    function( App, Backbone, ThemesNavModel) {

		return  Backbone.Collection.extend({
			model: ThemesNavModel,
			initialize: function(){
				// le Chooser sert à gérer les onglets
				new Backbone.SingleChooser(this);
			}
		});

    });