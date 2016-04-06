
define(['marionette', 'underscore', 'text!Wall/Ping/message.html'],
	function(Marionette, _, pingTpl) {
		return Marionette.ItemView.extend({

		    template: _.template(pingTpl),
		    
		    initialize: function(){
		    	// console.log("bon alors ... %o", this.model);
		    }
		});
	});