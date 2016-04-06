
define(['App', 'backbone', 'marionette', 'underscore', 'Themes/Model', 'text!Themes/dropdown/item-theme.html'],
	function(App, Backbone, Marionette, _, ThemesModel, tplTheme) {

		var ThemeItemView = Marionette.ItemView.extend({
		    // ThemesModel: ThemesModel,
		    model: ThemesModel,
		    template: _.template(tplTheme),
		    tagName: 'li',

		    events: {
		    	"click a": "selectTheme"
		    },

		    selectTheme: function(){
		    	this.trigger('theme:selected', this.model);
		    }
		});

		return ThemeItemView;
	});