define([ 'App', 'marionette', 'underscore', 'models/Race', 'text!Dash/master.html', 'text!Dash/master-race-item.html'],
    function (App, Marionette, _, Race, tplDashMaster, tplRaceItem) {

        var RaceRow = Marionette.ItemView.extend({
            template: _.template(tplRaceItem),
            tagName: "li",
            className: "presentation",
            model: Race,
            events: {
                "click": function(){ App.vent.trigger('dash:race:add', this.model.get('_id') ) }
            }
        });

        return Marionette.CompositeView.extend({
            
            template: _.template(tplDashMaster),
            childView: RaceRow,
            childViewContainer: "#dashMasterList",
            className: "page-header",

            initialize: function(){
                // this.collection.fetch();
                // _.bindAll(this, "parse_tweet_status");
            },

            events: {
                'submit form': "send_tweet",
                'click @ui.scrollLeft': "scroll_dashboard_left",
                'click @ui.scrollRight': "scroll_dashboard_right",
                'keyup @ui.bodyTweet': "parse_tweet_status",
                // 'blur @ui.bodyTweet': "unfocus_tweet",
            },
            ui: {
                form: "form",
                bodyTweet: "#body-tweet",
                countTweetLength: "#count-tweet-length",
                scrollLeft: ".scroll-left",
                scrollRight: ".scroll-right"
            },
            parse_tweet_status: function(){
                // calcul du nombre de caractères d'un tweet avec prise en compte des shorts urls de Twitter
                this.ui.countTweetLength.show();
                var tw = this.ui.bodyTweet.val();
                var tw_count = 140 - twttr.txt.getTweetLength(tw);
                this.ui.countTweetLength.val(tw_count);
                if(tw_count < 0){
                    this.ui.countTweetLength.addClass('toolong');
                }else{
                    this.ui.countTweetLength.removeClass('toolong');
                }
            },
            unfocus_tweet: function(){
                this.ui.countTweetLength.hide();
            },
            send_tweet: function(event){
                // @todo: modeliser coté python ?
                event.preventDefault();
                var that = this;
                $.post('/twitter/status', { status: $(this.ui.bodyTweet).val() }, function(data){
                    console.log(data);
                    $(that.ui.bodyTweet).val('');
                })
            },
            scroll_dashboard_left: function(){
                App.vent.trigger('dashboard:scroll:left');
            },
            scroll_dashboard_right: function(){
                App.vent.trigger('dashboard:scroll:right');
            },

        });
    });