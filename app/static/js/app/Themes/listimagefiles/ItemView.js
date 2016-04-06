
define(['App', 'backbone', 'marionette', 'underscore', 'Themes/listimagefiles/Model', 'text!Themes/listimagefiles/item.html'],
	function(App, Backbone, Marionette, _, FileModel, tplFile) {

		var ThemeItemView = Marionette.ItemView.extend({
		    model: FileModel,
		    template: _.template(tplFile),
		    tagName: 'li',

		    events: {
		    	"click a": "selectFile"
		    },

		    selectFile: function(){
		    	this.trigger('file:selected', this.model);
		    }
		});

		return ThemeItemView;
	});