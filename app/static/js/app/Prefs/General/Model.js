
define(['jquery', 'backbone'],
    function($, Backbone) {

        return Backbone.Model.extend({ 
            
            idAttribute: "_id",
            url: '/admin/prefs/',

            defaults: {
                'title': '',
            	'retweet': 1,
            	'bubble_timeout': 6
            },

            // validate: function(attrs) {
            //     console.log("tel que recu: ", attrs);
            //     // if(attrs.bubble_timeout && typeof(attrs.bubble_timeout) != "number"){
            //     if(typeof(attrs.bubble_timeout) != "number"){
            //         console.log("bubble_timeout doit être un 'number'");
            //     }
            // }

        });
    });

