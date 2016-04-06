
define(['App', 'backbone', 'marionette', 'underscore', 'Prefs/Model', 'text!Prefs/prefs-btn.html'],
	function(App, Backbone, Marionette, _, PrefsModel, tplBtn) {

		var NavView = Marionette.ItemView.extend({
		    model: PrefsModel,
		    template: _.template(tplBtn),
		    tagName: 'li',

		    initialize: function(){
		    	// ces events sont triggés par le controller
		        this.listenTo(App.vent, 'prefsmenu:navigate:'+this.model.get('name'), this.chooseModel);
		    },

		    events: {
		    	"click": "goToCategory"
		    },

		    modelEvents: {
		        "change:chosen": "setActive",
		    },

		    setActive: function(){
		    	if(this.model.get('chosen')){
		    		this.$el.addClass('active');
		    	}else{
		    		this.$el.removeClass('active');
		    	}
		    },

		    chooseModel: function(){
		        this.model.choose();
		    },

		    goToCategory: function(){
		    	this.trigger("some:event", this.model.get('name'));
		    }
		});

		return NavView;
	});