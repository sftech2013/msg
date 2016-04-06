define(['App', 'backbone', 'marionette', 'underscore', 'Prefs/Model', 'text!Header/app-title.html'],
	function(App, Backbone, Marionette, _, PrefsModel, tplTitle) {

		var AppTitleView = Marionette.ItemView.extend({
			// @todo: Ne devrait pas être lié au module Pref
		    model: PrefsModel,
		    template: _.template(tplTitle),
		    tagName: 'span',

		    initialize: function(){
		    	// triggé par le module Prefs
		        this.listenTo(App.vent, "prefs:updated:title", this.changeTitle);
		    },

		    changeTitle: function(data){
		    	this.model.set(data);
		    	this.render();
		    }

		});

		return AppTitleView;
	});