
define(['App', 'backbone', 'marionette', 'underscore', 'Themes/Model', 'text!Themes/List/item.html'],
	function(App, Backbone, Marionette, _, ThemesModel, tplThemesItem) {

		var ItemView = Marionette.ItemView.extend({
		    model: ThemesModel,
		    template: _.template(tplThemesItem),
		    tagName: 'li',
		    className: 'themes-item list-group-item media',

		    ui: {
		    	deleter: ".deleter"
		    },

		    events: {
		    	"click @ui.deleter": "removeDumber"
		    },

		    removeDumber: function(event){
		    	// event.preventDefault();
		    	console.log(this.model);
		    	this.model.destroy({success: function(model, response) {
					console.log("removed: %o", model);
				}});
		    }
		});

		return ItemView;
	});
