
define(['App', 'marionette', 'underscore', "collections/RaceCollection", "Devices/collection", "ColMenu/RaceItemLayout", 
    "ColMenu/NoItemRaceView"],

  function(App, Marionette, _, RaceCollection, DevicesCollection, RaceItemLayout, NoItemRaceView) {

    var RaceCollectionView = Marionette.CollectionView.extend({

        childView: RaceItemLayout,
        emptyView: NoItemRaceView,
        tagName: 'ul',
        className: 'list-group media-list',

        events: {
            'update-sort': 'updateSort'
        },

        emptyViewOptions: function(){
            return {msg: this.msg}
        },

        childViewOptions: function(model, index){
            var fc = this.collection.byFilter(this.col_filter, this.col_filter_values);
            var is_filtered = (fc.get(model)) ? true : false;
            return {is_filtered: is_filtered}
        },

        initialize: function(options) {
            // message par défaut pour l'emptyView
            this.msg = "";
            this.col_filter = options.filter;
            this.col_filter_values = options.filter_values;

            this.listenTo(App.vent, 'race:added', this.addNewRace);
            this.listenTo(App.vent, "race:removed", this.refetch);
            this.listenTo(App.vent, "dumber:added", this.refetch);
            this.listenTo(App.vent, "dumber:removed", this.refetch);
            this.listenTo(App.vent, "messages:removed", this.refetch);

        },

        refetch: function(){
            this.collection.fetch();
        },

        addNewRace: function(race){
            // sans doute pas au colMenu d'écouter cet event
            // d'autant qu'on ajoute dans la collec principale ...
            App.Main.races.add(race);
        },

        onRender: function(){
            this.$el.sortable({
                handle: ".grippy",
                stop: function(event, ui) {
                    ui.item.trigger('drop', ui.item.index());
                },
                // connectWith: ".feeders"          // rigolo :)
            });
            //this.$el.disableSelection();
        },

        updateSort: function(event, model, position) {
            this.collection.remove(model);

            this.collection.each(function (model, index) {
                var order = index;
                if (index >= position)
                    order += 1;
                model.save({'order': order}, {patch: true});
            });
            
            model.save({'order': position}, {patch: true});
            this.collection.add(model, {at: position});

            console.log("On update là ?");
            
            // FIXED couplage direct avec ce passage de région
            // Ce n'est plus verouillé sur le DashBoard mais c pas la solution idéale pour autant
            this.render();
            App.vent.trigger("races:sorted");
        }
        
    });

    return RaceCollectionView;

  }

);