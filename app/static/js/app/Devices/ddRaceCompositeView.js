
define(['App', 'marionette', 'underscore', "collections/RaceCollection", "Devices/ddRaceView", "text!Devices/dd-layout.html"],

  function(App, Marionette, _, RaceCollection, ddRaceView, tplContainer) {
    
    var NoItemsView = Marionette.ItemView.extend({
        template: _.template("Pas de live")
    });

    return Marionette.CompositeView.extend({

        template: _.template(tplContainer),
        childView: ddRaceView,
        childViewContainer: ".ddRaces",
        emptyView: NoItemsView,

        initialize: function(options) {
            this.childViewOptions = {
                device_id: options.device_id,
                device_race_id: options.device_race_id,
                server_info: options.server_info
            }
            // this.deferred_fetch();
            // this.listenTo(App.vent, 'race:added', this.deferred_fetch);
        },

        // deferred_fetch: function(){
        //     var col = new RaceCollection(this.options);
        //     col.deferred = col.fetch();

        //     var that = this;
        //     col.deferred.done(function() {
        //         that.collection = col;
        //         that.render();
        //     });
        // },
        
    });

  }

);
