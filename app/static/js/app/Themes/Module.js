define([ "App", "marionette","Themes/Collection"], 
	function(App, Marionette, ThemeCollection){
		var Themes = App.module("Themes");

		Themes.startWithParent = true;

		Themes.addInitializer(function(themes){
			this.Collec = new ThemeCollection(themes);
			var that = this;
			App.reqres.setHandler('getThemeByIdent', function(identifier) {
				// Usage : App.request('getThemeByIdent','default');
			    var thm = that.Collec.findWhere({'identifier': identifier});
			   return thm;
			});
		});

		return Themes;

	});