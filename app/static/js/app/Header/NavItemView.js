
define(['App', 'backbone', 'marionette', 'underscore', 'Header/NavModel', 'text!Header/navigation-btn.html'],
	function(App, Backbone, Marionette, _, NavModel, tplBtn) {

		var NavView = Marionette.ItemView.extend({
		    model: NavModel,
		    template: _.template(tplBtn),
		    tagName: 'li',

		    ui: {
		    	counterBadge: ".counter"
		    },

		    initialize: function(){
		        this.listenTo(App.vent, 'menu:navigate:'+this.model.get('name'), this.chooseModel);

		        // Ajout d'un compteur d'items et des events inc, dec, update
		        if(this.model.get('counter')){
		        	this.collection = new Backbone.Collection();
		        	var labelEvent = this.model.get('counter').labelEvent;
		        	this.listenTo(App.vent, labelEvent+":init", this.initCounter);
		        	this.listenTo(App.vent, labelEvent+":inc", this.incCounter);
		        	this.listenTo(App.vent, labelEvent+":dec", this.decCounter);
		        }
		    },

		    modelEvents: {
		        "change:chosen": "setActive",
		    },

		    initCounter: function(collec){
		    	// console.log("Init compteur '%s', nouvelle collec: %o", this.model.get('label'), collec);
			    this.collection = collec;
		    	this.model.set('counter',  {value: collec.models.length, labelEvent: this.model.get('counter').labelEvent });
		    	$(this.ui.counterBadge).text(this.model.get('counter').value);
		    	if(this.model.get('counter').value){
			    	$(this.ui.counterBadge).addClass('active');
		    	}
		    },

		    // @todo:
		    // moyen de factoriser incCounter et decCounter avec un passage de param ('inc','dec')
		    incCounter: function(obj){
		    	if( ! this.collection.get(obj.id)){
		    		console.log("Incrémentation compteur '%s', nouvel objet: %o", this.model.get('label'), obj);
			    	var val = this.model.get('counter').value;
			    	this.model.set('counter', {value: val + 1, labelEvent: this.model.get('counter').labelEvent });
			    	$(this.ui.counterBadge).text(this.model.get('counter').value);
			    	$(this.ui.counterBadge).addClass('active');
			    	this.collection.add(obj);
			    }
		    },

		    decCounter: function(obj){
		    	if(this.collection.get(obj.id)){
		    		console.log("Décrémentation compteur '%s', ancien id: %o", this.model.get('label'), obj);
			    	var val = this.model.get('counter').value;
			    	this.model.set('counter', {value: val - 1, labelEvent: this.model.get('counter').labelEvent });
			    	$(this.ui.counterBadge).text(this.model.get('counter').value);
			    	if(!this.model.get('counter').value){
			    		$(this.ui.counterBadge).removeClass('active');
			    	}
			    	this.collection.remove(obj);
			    }
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
		    }
		});

		return NavView;
	});