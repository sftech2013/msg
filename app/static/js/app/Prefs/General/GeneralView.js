
define(['App', 'marionette', 'underscore', 'Prefs/General/Model', 'text!Prefs/General/general.html'],
	function(App, Marionette, _, PrefsModel, tplGeneral) {

		var GeneralView = Marionette.ItemView.extend({
		    template: _.template(tplGeneral),
		    model: PrefsModel,

		    ui: {
		    	optionsForm: "form",
		    	submitBanner: ".submit-banner",
		    	// cbRetweet: "#cbRetweet",
		    	BubbleTimeout: "#inputBubbleTimeout",
		    	inputEmbedly: "#inputEmbedly",
		    	submitBtn: ".submit",
		    	backDash: ".backDash",

		  //   	inputRT: "#inputRT",
		  //   	retweeton: "#retweeton",
				// retweetoff: "#retweetoff",
				retweets: ".retweets",
		    },
		    
		    initialize: function(){ 
		    	// _.bindAll(this, "alertChange");
		    },

		    events: {
		    	"click @ui.submitBtn": "submitForm",
		    	// "change input": "alertChange",
		    	// "change textarea": "alertChange",
		    	// "keypress input, textarea": "kpListener",
		    	// "keydown input, textarea": "kpListener",
				// "keypress textarea": "kpListener",
		    	// "keydown textarea": "kpListener",

		    	"click @ui.retweets": "toggleRT",
		    },

		    // alertChange: function(event){
		    // 	$(this.ui.submitBanner).addClass('active').removeClass('inactive');
		    // 	$(this.ui.submitBtn).addClass('btn-danger').removeClass('btn-blacky').removeClass('disabled');
		    // },

		    toggleRT: function(event){
		    	var target = $(event.currentTarget).attr('toggle-target');
		    	console.log($(target));
		    	$(target).button('toggle');
		    },

		    submitForm: function(event){
		    	var data = Backbone.Syphon.serialize(this);

		    	if(_.has(data, 'bubble_timeout'))
		    		data.bubble_timeout = parseInt(data.bubble_timeout);

		    	var newdata = this.model.changedAttributes(data) || {};

		    	console.log("nouvelle data: ", newdata);

		    	var that = this;
		    	this.model.deferred = this.model.save(newdata, {patch: true});
		    	this.model.deferred.done(function(){
		    	    that.ui.backDash.show();
		    	});
		    },

		    // kpListener: function(event){
		    // 	console.log(event.which);
		    // 	console.log($(event.currentTarget));
		    // 	this.alertChange();

		    // 	if(event.which == 13){
		    // 		event.preventDefault();

		    // 		// $(event.currentTarget).blur();
		    // 	}
		    // }

		});

		return GeneralView;
	});