
define(['marionette', 'underscore', 'text!Dash/no-feed.html'],
	function(Marionette, _, emptyTemplate) {

		return Marionette.ItemView.extend({
		    template: _.template(emptyTemplate),
		    initialize: function(options){
		        this.model.set('msg',options.msg);
		    }
		});
		
	});