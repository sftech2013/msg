define(["jquery", "backbone"],
    function ($, Backbone) {

        var Model = Backbone.Model.extend({

            idAttribute: "_id",
            url: "/dumbers/",

            destroy: function (options) {
            	var customUrl = '/dumbers/' + this.get('_id');
            	return Backbone.Model.prototype.destroy.call(this, _.extend({url: customUrl}, options)); 
            }

        });

        return Model;
    }
);