
define(['App', 'backbone', 'marionette', 'underscore', 'Devices/model', 'Devices/ddRaceCompositeView', 'text!Devices/device.html'],
	function(App, Backbone, Marionette, _, Model, ddRaceCompositeView, tpl) {

		var childView = Marionette.LayoutView.extend({
		    model: Model,
		    template: _.template(tpl),
		    tagName: 'li',
		    className: 'list-group-item',

		    regions: {
		    	ddCont: ".ddCont"
		    },

		    ui: {
		    	openFreeUrl: ".openFreeUrl",
		    	normalGroup: ".normalGroup",
		    	freeurlGroup: ".freeurlGroup",
		    	inputGroom: ".inputGroom",
		    	destroyBtn: ".destroyBtn",
		    	btnGroom: ".btnGroom",
		    	btnPing: ".btnPing"
		    },

		    initialize: function(options){
		    	this.racecollec = options.racecollec;
		    },

		    onRender: function(){
		    	this.ddCont.show( new ddRaceCompositeView({
		    		collection: this.racecollec, 
		    		device_id: this.model.get('id'),
		    		device_race_id: this.model.get('race_id'),
		    		server_info: this.options.server_info
		    	}) );
		    },

		    modelEvents: {
		    	"change": "render"
		    },

		    events: {
		    	"click @ui.btnPing": "pingScreen",
		    	"click @ui.btnGroom": "sendDeviceTo",
		    	"click @ui.openFreeUrl > button": "showFreeUrl",
		    	"click @ui.destroyBtn": "hideFreeUrl"
		    },

		    showFreeUrl: function(){
		    	this.ui.freeurlGroup.css({display: 'inline-block'});
		    	this.ui.normalGroup.css({display: 'none'});
		    },

		    hideFreeUrl: function(){
		    	this.ui.freeurlGroup.css({display: 'none'});
		    	this.ui.normalGroup.css({display: 'inline-block'});
		    },

		    pingScreen: function(){
		    	console.log("id cliqued: %o", this.model.get('id'));
		    	App.socket.emit("ping_screen", this.model.get('id'));
		    },

		    sendDeviceTo: function(){
		    	var urlwall = this.ui.inputGroom.val();
		    	console.log("send %s cliqued: %s", this.model.get('id'), urlwall);
		    	App.commands.execute("sendDevice", this.model.get('id'), urlwall);
		    }

		});

		return childView;
	});