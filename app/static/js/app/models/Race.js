define(["jquery", "backbone"],
    function ($, Backbone) {
        // Creates a new Backbone Model class object
        var Race = Backbone.Model.extend({

            idAttribute: "_id",
            urlRoot: "/races/",

            defaults:{
                // on devrait avoir les valeurs par défaut de la config ici
                title: '',
                hashtag_str: '',
                status: 'started',
                steps: [],
                visible: 1,
                phone_number: '',
                desc: '',
                theme: 'default',
                
                _unshown: 0,
                _is_scrolling: false
            },

        });

        return Race;
    }
);