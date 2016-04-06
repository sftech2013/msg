
define(['marionette', 'underscore', 'text!ColMenu/empty-race-collection.html'],
	function(Marionette, _, emptyTemplate) {

		return Marionette.ItemView.extend({
		    template: _.template(emptyTemplate),
		    tagName: 'li',
		    className: "list-group-item racer media",
		    initialize: function(options){
		        this.model.set('msg',options.msg);
		    }
		});
		
	});