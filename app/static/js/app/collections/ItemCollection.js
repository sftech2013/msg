define(["jquery","backbone","moment","models/Item"],
	function($, Backbone, moment, Item) {

		var ItemCollection = Backbone.Collection.extend({

			model: Item,

			url: function(target,filter) {
				var param = (filter) ? target+"?"+filter+"=1" : target
				return "/messages/"+param;
			},

			comparator: function(item){
				return moment(item.get('ctime'));
			}

		});

		return ItemCollection;
	});