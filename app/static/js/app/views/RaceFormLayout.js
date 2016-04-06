define([ 'App', 'backbone', 'marionette', 'underscore', 'models/Race', 'collections/ItemCollection', 'text!templates/race-form.html'],
    function (App, Backbone, Marionette, _, Race, ItemCollection, tplFormRace) {

        // return Marionette.ItemView.extend({
        return Marionette.LayoutView.extend({

            model: Race,
            template: _.template(tplFormRace),
            tagName: "div",

            regions: {
                "themeList": ".cont_themes",
            },

            initialize: function(){
                _.bindAll(this, 'removeMessages');
                // collection par defaut du layout utilisée pour stocker la collec de Thèmes
                // FIXME collection undefined
                console.log("init du RaceFormLayout, model: %o | collectiob: %o", this.model, this.collection);
                // console.log("ce model est %o", this.model.isNew());
                this.model.set('is_new', this.model.isNew());
            },

            ui: {
                fullFormRace: "#fullFormRace",
                backDash: ".backDash",
                submitFormRace: "#submitFormRace",
                removeMessages: '.remove-messages',
                deleteWall: '.delete-wall',
            },

            modelEvents: {
                "change:theme": "themeSelected"
            },

            events: {
                "submit form": "onSubmitForm",
                "click @ui.removeMessages": "removeMessages",
                "click @ui.deleteWall": "deleteWall",
            },
            themeSelected: function(){
                console.log("Nouveau Thème sélectionné");
                // this.ui.submitFormRace.addClass('active');
                this.ui.fullFormRace.trigger("submit");
            },  
            onSubmitForm: function(event){
                // @todo: sert pour création ET édition. Or, l'event "race:add" est triggé à chaque edit.
                // Possible que cela ne pose pas de pb à BB/Marionette, mais c pas très classe
                event.preventDefault();
                var data = Backbone.Syphon.serialize(this);

                if(data['hashtag'] != this.model.get('hashtag_str') ){
                    // redémarrage du stream requis
                    // @todo: devrait etre factorisé dans le model
                    App.vent.trigger("stream:restart:required", {action: "modification hashtag"});
                }

                var that = this;
                console.log("on patch: %o", data);
                this.model.deferred = this.model.save(data, {patch: true});
                this.model.deferred.done(function(){
                    that.ui.backDash.show();
                    // triggé mais pas écouté
                    // App.vent.trigger("race:add", that.model);
                });
                
            },

            removeMessages: function(){
                // @todo: ca devrait etre une commande, ou au moins une méthode sync sur la collection
                // on retrouve ça dans Dash.Feed.MsgCollectionView
                if(confirm("Voulez-vous vraiment supprimer tous les messages de ce Wall ?\n Attention cette action est irréversible")){
                    var that = this;
                    var collec = new ItemCollection();
                    console.log(this.model.get('_id'));
                    collec.url = collec.url(this.model.get('_id'), '');
                    Backbone.sync('delete', collec, {
                        success: function(data){
                            App.vent.trigger('messages:removed');
                        }
                    });
                }
            },

            deleteWall: function(){
                if(confirm("Voulez-vous vraiment supprimer ce Wall et tous ses messages ?\n Attention cette action est irréversible")){
                    this.model.destroy({
                        success: function(model, response){
                            App.vent.trigger('race:removed');

                            App.vent.trigger("stream:restart:required", {action: "Race destroy demand"});

                            App.Main.races.fetch({
                                success: function(model, resp){
                                    App.appRouter.navigate('/', true);
                                }
                            })
                        }
                    });
                }
            }



        });
    });