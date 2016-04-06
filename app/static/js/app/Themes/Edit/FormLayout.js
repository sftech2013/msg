
define(['App', 'backbone', 'marionette', 'underscore', 'Themes/Model', 'Themes/listimagefiles/CompositeView',
			 'Themes/Edit/colorpickerinput/CollectionView', 'Themes/Edit/colorpickerinput/View', 
			 'text!Themes/Edit/form.html'],
	function(App, Backbone, Marionette, _, ThemesModel, ListImageCompositeView, cpInputCollectionView, cpInputView, tplThemesItem) {

		var LayoutView = Marionette.LayoutView.extend({
		    model: ThemesModel,
		    template: _.template(tplThemesItem),
		    tagName: 'div',

		    regions: {
		    	selectLogo: "#selectLogo",
		    	// colorBlock: "#colorBlock"
		    },

		    initialize: function(){
		    	_.bindAll(this, 'calcPreview', 'submitAll', '_compilWaiting', '_compilReturn', '_compilUnblock');
		    	console.log("init du formview Theme: %o", this.model);
		    	this.offScreenPreview = new Image();
		    	this.offScreenPreview.src = this.model.get('preview');
		    	$(this.offScreenPreview).load(this.calcPreview);

		    	this.listenTo(App.vent, 'theme:haschanged', this._compilUnblock)
		    },

		    ui: {
		    	infoForm: ".info-form",
		    	logoForm: "#logoForm",

		    	btnCompile: "#btnCompile",
		    	preloader: ".preloader",
		    	themePreview: ".theme-preview",
		    	alertSubmit: ".alert-submit",

		    	InputPreviewWidth: ".preview-width",
		    	InputPreviewHeight: ".preview-height",

		    	Inputs: "input",
		    	colorWidgetCont: '.color-picker-field',

		    	bucketDwl: ".bucket-dwl",
		    	bucketUp: ".bucket-up"
		    },

		    events: {
		    	// "keypress input, textarea": "kpListener",
		    	// "change @ui.colorPickers": "changeColorDyn",
		    	"submit @ui.infoForm": "submitAll",
		    	// "submit @ui.logoForm": "submitFile",
		    	"change @ui.Inputs": "_compilUnblock",
		    	"click @ui.bucketDwl": "downloadTheme",
		    	"click @ui.bucketUp": "uploadTheme"
		    },

		    _setRegions: function(){
		    	var files = new Backbone.Collection(this.model.get('options').files)
		    	console.log("my files: %o", files);
		    	var listImage = new ListImageCompositeView({collection: files, model: this.model});
		    	this.selectLogo.show(listImage);

		    	var styles = new Backbone.Model(this.model.get('options').styles);
		    	this._feedCpInputWidget(styles);
		    },

		    _feedCpInputWidget: function(styles){
		    	var that = this;
		    	_.each(this.ui.colorWidgetCont, function(container){
		    		var keyname = $(container).attr('id');
		    		var keyval = styles.get(keyname);
		    		that.addRegion(keyname, "#"+keyname);
		    		var wdg = new cpInputView({model: new Backbone.Model({name: keyname, lessval: keyval}) });
		    		that.getRegion(keyname).show(wdg);
		    	})
		    },

		    // _listAllStyles: function(){
			//    	var ssModel = new Backbone.Model(this.model.get('options').styles);
    		// 	var collecClass = new Backbone.Collection();
    		// 	_.each(ssModel.pairs(), function(c){
    		// 		collecClass.add({name: c[0], lessval: c[1]});
    		// 	});
    		// 	this.colorBlock.show(new cpInputCollectionView({collection: collecClass}));
		    // },

		    submitAll: function(event){
		    	console.log("submitAll");
		    	event.preventDefault();
		    	// var data = Backbone.Syphon.serialize(this);
		    	var data = Backbone.Syphon.serialize(this, {
					exclude: ["image"]
				});
		    	console.log("data %o", data);
		    	var that = this;
		    	this._compilWaiting();
		    	// 'submitAll' ... c'est pas du patch ...
		    	this.model.save(data, {
	    			// patch: true,
		    		success: function(data){
		    			console.log("Traitement terminé");
		    			$(that.ui.themePreview).attr('src', that.model.get('preview')+'?reload='+moment().unix());
		    			that._compilReturn();
		    		},
		    		error: function(data,resp){
		    			jsonresp = resp.responseJSON;
		    			console.log(jsonresp);
		    			if(jsonresp.error.length){
		    				switch(jsonresp.code){
		    					case 'norace':
		    						var label = "Erreur de compilation!";
		    						var msg = "Au moins un live doit utiliser le thème";
		    						break;
		    					case 'noright':
		    						var label = "Erreur de permission!";
		    						var msg = "Vous n'avez pas les droits pour effectuer cette opération...";
		   							break;
		   						case 'compil':
		   							var label = "Erreur de compilation!";
		   							var msg = jsonresp.error;
		   							break;
		    				}
		    				that._compilError({label: label, msg: msg});
		    			}
		    		}
		    	});
		    },

		    _compilBlock: function(){
		    	$(this.ui.btnCompile).attr('disabled', 'disabled');
		    	$(this.ui.btnCompile).html("Modifiez d'abord le thème");
		    	$(this.ui.btnCompile).removeClass('btn-warning btn-danger').addClass('btn-blacky');
		    },

		    _compilUnblock: function(){
		    	$(this.ui.btnCompile).removeAttr('disabled');
		    	$(this.ui.btnCompile).html('Compilez le thème');
		    	$(this.ui.btnCompile).removeClass('btn-blacky btn-danger').addClass('btn-warning');

		    	$(this.ui.alertSubmit).html('data.msg');
		    	$(this.ui.alertSubmit).css({display: 'none'});
		    },

		    _compilWaiting: function(){
		    	$(this.ui.btnCompile).attr('disabled', 'disabled');
		    	$(this.ui.btnCompile).html('<i>Compilation en cours...</i>');

		    	$(this.ui.preloader).show();
				$(this.ui.preloader).css({display: 'block'});
		    	$(this.ui.themePreview).css({opacity: .5});
		    },

		    _compilReturn: function(){
		    	// $(this.ui.btnCompile).removeAttr('disabled');
		    	// $(this.ui.btnCompile).html('Compilez le thème');
		    	this._compilBlock();

		    	$(this.ui.preloader).hide();
		    	$(this.ui.preloader).css({display: 'none'});
		    	$(this.ui.themePreview).css({opacity: 1});
		    },

		    _compilError: function(data){
		    	$(this.ui.btnCompile).attr('disabled', 'disabled');
		    	$(this.ui.btnCompile).removeClass('btn-warning').addClass('btn-danger');
		    	$(this.ui.btnCompile).html(data.label);
		    	
		    	$(this.ui.preloader).hide();
		    	$(this.ui.preloader).css({display: 'none'});
		    	$(this.ui.themePreview).css({opacity: 1});

		    	$(this.ui.alertSubmit).html(data.msg);
		    	$(this.ui.alertSubmit).css({display: 'block'});
		    },

		    calcPreview: function(){
		    	this.ui.InputPreviewWidth.val( this.offScreenPreview.width );
		    	this.ui.InputPreviewHeight.val( this.offScreenPreview.height );
		    },



		    checkColor: function(color){
		    	console.log(color.toRgbString());
		    },


		    // submitFile: function(event){
		    // 	console.log("submitFile");
		    // 	event.preventDefault();
		    // 	var data = Backbone.Syphon.serialize(this, {
		    // 		include: ["image"]
		    // 	});
		    // 	console.log(data);
		    // 	var img = new Backbone.Model();
		    // 	// data['contentType'] = 'multipart/form-data';

		    // 	img.save(data, {	
		    // 		url: "/theme/"+this.model.get('identifier')+"/upload",
		    // 		contentType: 'multipart/form-data',
		    // 		success: function(data){
		    // 			console.log("faiiiiiiim");
		    // 		}
		    // 	});
		    // },


		    downloadTheme: function(){
		    	console.log("download en cours");
		    	$.get('/s3/theme/'+this.model.get('identifier'), {download: 1});
		    },

		    uploadTheme: function(){
		    	console.log("upload en cours");
		    	$.post('/s3/theme/'+this.model.get('identifier'), {});
		    }

		});

		return LayoutView;
	});
