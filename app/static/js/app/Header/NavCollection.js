
define([ 'App', 'backbone', 'Header/NavModel'],
    function( App, Backbone, NavModel) {

		return  Backbone.Collection.extend({
			model: NavModel,
			initialize: function(){
				new Backbone.SingleChooser(this);
			}
		});

    });