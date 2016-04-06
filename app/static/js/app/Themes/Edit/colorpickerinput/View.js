
define(['App', 'backbone', 'marionette', 'underscore', 'Themes/Edit/colorpickerinput/Model', 'text!Themes/Edit/colorpickerinput/cp-input.html'],
	function(App, Backbone, Marionette, _, cpInputModel, tplInput) {

		var NavView = Marionette.ItemView.extend({
		    model: cpInputModel,
		    template: _.template(tplInput),
		    tagName: 'div',
		    ui: {
		    	Picker: '.picker',
		    	coPicker: '.copicker'
		    },
		    initialize: function(){
		    	console.log(this.model);

		    },

		    events: {
		    	"blur @ui.coPicker": "checkInput",
		    	"keyup @ui.coPicker": "checkInput",
		    	"keydown @ui.coPicker": "checkInput",
		    },
		    modelEvents: {
		    	"change": "updatedModel"
		    },
		    onRender: function(){
		    	var that = this;
	    		this.ui.Picker.spectrum({
	    			showAlpha: true,
	    			showInput: true,
	    			showInitial: true,
	    			allowEmpty: true,
	    			clickoutFiresChange: true,
	    			// preferredFormat: "rgb",
	    			change: function(color){
	    				if(color){
	    					console.log(color.toRgbString());
	    					console.log(color);
	    					that.model.set('lessval', color.toRgbString());
	    					that.ui.coPicker.val(that.model.get('lessval'));
	    				}
	    				else{
	    					// that.model.set('lessval', 'transparent');
	    					// that.ui.coPicker.val(that.model.get('lessval'));
	    					that.model.set('lessval', '');
	    					that.ui.coPicker.val('transparent');
	    				}
	    			}
	    		});
		    },
		    checkInput: function(event){
		    	this.model.set('lessval', $(event.currentTarget).val());
		    },
		    updatedModel: function(){
		    	console.log("update me, i'm %o", this.model.get('name'));
		    	if(!tinycolor(this.model.get('lessval')).isValid() ){
		    		// console.log("on disable");
		    		// this.ui.Picker.spectrum('disable');
		    	}
		    	this.ui.Picker.spectrum('set', this.model.get('lessval'));
		    	// this.ui.coPicker.val(this.model.get('lessval'));
		    }

		});

		return NavView;
	});