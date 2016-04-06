define([ 'App', 'marionette', 'underscore', 'text!Devices/dd-race-view.html'],
    function (App, Marionette, _, ddRaceTpl) {

        return Marionette.ItemView.extend({
            
            template: _.template(ddRaceTpl),
            tagName: "li",

            initialize: function(options){
                // @memo le device_id est passé en options.
                // on construit l'url du wall, complète...
                var serv = options.server_info;
                var domain = (serv.host.length && serv.port) ? serv.host+":"+serv.port : serv.host;
                var wallurl = "http://"+domain+"/wall/"+this.model.get('_id');
                this.model.set('wallurl', wallurl);
            },

            events: {
                "click": "wallSelected"
            },

            onRender: function(){
                if(this.options.device_race_id == this.model.get('_id')){
                    this.$el.addClass('disabled');
                }
            },

            wallSelected: function(event){
                console.log("click sur %s vers %s", this.options.device_id, this.model.get('wallurl'));
                if(this.options.device_race_id != this.model.get('_id')){
                    App.commands.execute("sendDevice", this.options.device_id, this.model.get('wallurl'));
                }else{
                    console.log("déjà sur cette race");
                }
            }

        });
    });