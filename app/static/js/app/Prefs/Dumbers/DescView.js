define([ 'App', 'backbone', 'marionette', 'underscore', 'text!Prefs/Dumbers/description.html'],
    function (App, Backbone, Marionette, _, tplDesc) {

        return Marionette.ItemView.extend({
            template: _.template(tplDesc),
            className: "alert alert-warning",
        });
    });