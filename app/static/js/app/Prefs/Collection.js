
define([ 'App', 'backbone', 'Prefs/Model'],
    function( App, Backbone, PrefsModel) {

		return  Backbone.Collection.extend({
			model: PrefsModel,
			initialize: function(){
				// le Chooser sert à gérer les onglets
				new Backbone.SingleChooser(this);
			}
		});

    });