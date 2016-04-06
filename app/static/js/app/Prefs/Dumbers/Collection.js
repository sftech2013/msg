define(["jquery", "backbone", "Prefs/Dumbers/Model"],
	function($, Backbone, Model) {

		var DumbersCollection = Backbone.Collection.extend({

			model: Model,
			url: "/dumbers/"

			// comparator: function(item){
			// 	return item.get('ctime').$date;
			// }

		});

		return DumbersCollection;
	});