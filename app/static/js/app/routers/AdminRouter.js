define(['marionette', 'controllers/AdminController'], 
    function(Marionette, Controller) {
        return Marionette.AppRouter.extend({

            appRoutes: {
                "": "index",
                // @surveiller: filter ne doit plus être utilisé
                "filter/:filter/:filter_values": "filter",
                // "list": "list",
                "create": "create",
                "edit/:id": "edit",
                "devices": "devices",
                // "themes(/:action)": "themes",
                "themes(/:action)(/:ident)": "themes",
                "options(/:category)": "preferences",

                "index": "index"
            }
        });
    });