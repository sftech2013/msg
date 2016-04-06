
define(['backbone', 'marionette','underscore','socketio'], 
    function(Backbone, Marionette, _, io) {

        var socket_callbacks = [
            ['connect','socket:connected'],
            ['disconnect','socket:disconnected'],
            ['message_to_race', 'feed:add'],
            ['visible', 'feed:visible'],
            ['stared', 'feed:stared'],
            ['openbubble', 'bubble:exec:open'],
            ['destroybubble', 'bubble:exec:destroy'],
            // Dumbers
            ['dumber_added', 'dumber:added'],
            ['dumber_removed', 'dumber:removed'],
            // Walls
            ['ping', 'remote:ping'],
            ['gotourl', 'remote:gotourl'],
            // Themes
            ['theme_updated', 'theme:updated'],
        ];

        var sck = Marionette.Object.extend({
            initialize: function(){
                this.socketUrl = "/shouts";
                this.socket = io.connect(this.socketUrl);
                var globalCh = Backbone.Wreqr.radio.channel('global');
                var that = this;
                _.each(socket_callbacks,function(signal){
                    that.socket.on(signal[0], function(data) {
                        if (typeof(data) != "undefined") {
                            console.log('trigger %s | %o',signal[1],data);
                            globalCh.vent.trigger(signal[1],data);
                        } else {
                            console.log('trigger %s',signal[1]);
                            globalCh.vent.trigger(signal[1]);
                        }
                    });
                });

                this.socket.on('race_updated', function(data){
                    console.log("Race modifiée: %o", data['race']);
                    globalCh.vent.trigger("race:updated:"+data.race._id, data);
                });

                window.onbeforeunload = function(){
                    that.socket.emit("leave_all");
                }
            }
        });

        return sck;
    }
);

