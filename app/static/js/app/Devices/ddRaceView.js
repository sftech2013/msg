define([ 'App', 'marionette', 'underscore', 'text!Devices/dd-race-view.html'],
    function (App, Marionette, _, ddRaceTpl) {

        return Marionette.ItemView.extend({
            
            template: _.template(ddRaceTpl),
            tagName: "li",

            initialize: function(options){
                // @memo le device_id est passé en options.
                // on construit l'url du live, complète...
                var serv = options.server_info;
                var domain = (serv.host.length && serv.port) ? serv.host+":"+serv.port : serv.host;
                var liveurl = "http://"+domain+"/live/"+this.model.get('_id');
                this.model.set('liveurl', liveurl);
            },

            events: {
                "click": "liveSelected"
            },

            onRender: function(){
                if(this.options.device_race_id == this.model.get('_id')){
                    this.$el.addClass('disabled');
                }
            },

            liveSelected: function(event){
                console.log("click sur %s vers %s", this.options.device_id, this.model.get('liveurl'));
                if(this.options.device_race_id != this.model.get('_id')){
                    App.commands.execute("sendDevice", this.options.device_id, this.model.get('liveurl'));
                }else{
                    console.log("déjà sur cette race");
                }
            }

        });
    });