define(["jquery", "backbone"],
    function ($, Backbone) {
        // @verif: model ? controller ?
        var Embed = Backbone.Model.extend({

            initialize:function (options) {
            	console.log("embedly init");
            	// this.makeDefer(options);
            },

            makeDefer: function(options){
                console.log("makeDefer starting pour %s", options.expanded_url);
            	var def = $.embedly.oembed(options.expanded_url, {
                    query: {maxwidth: 1280, autoplay: true},
				}).progress(function(obj){ 
					console.log("waiting...");
				});
        		return def;
            }

        });

        return Embed;
    }
);