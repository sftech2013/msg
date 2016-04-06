
define(["jquery", "backbone", "marionette"],

    function($, Backbone, Marionette) {
        
        var ModalRegion = Marionette.Region.extend({

            el: "#bubble",
            ui: { divmodal: "#modal" },

            constructor: function(){
                _.bindAll(this);
                Backbone.Marionette.Region.prototype.constructor.apply(this, arguments);
                this.on("show", this.showModal, this);
            },

            getEl: function(selector){
                var $el = $(selector);
                $el.on("hidden.bs.modal", this.hideModal);
                $el.on("shown.bs.modal", this.shownModal);
                return $el;
            },

            initialize: function(options){
                this.prefs = options;
            },

            showModal: function(view){
                view.on("destroy", this.hideModal, this);
                $("#modal", this.$el).modal('show');
            },

            shownModal: function(view){
                // déclenchement de _onFinishRender pour le resize des medias dans la view en cours: AdminBodyView vs WallView
                // plus de référence à l'App/Wall 
                this.currentView._onFinishRender();
            },

            hideModal: function(){
                $("#modal", this.$el).modal('hide');
                this.$el.empty();
            }
        });

        return ModalRegion;
    });