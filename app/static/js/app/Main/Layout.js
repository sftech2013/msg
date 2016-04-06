
define( [ 'App', 'marionette', 'underscore', 'text!Main/layout.html'],

    function( App, Marionette, _, tplDash) {

        return Marionette.LayoutView.extend( {
            
            template: _.template(tplDash),
            className: 'Dash',
            
            regions: {
                ColMenu: "#col-menu",
                // DashMaster: "#DashMaster",
                // DashBoard: "#DashBoard"
                DashMain: "#DashMain"
            },

            ui: {
                colContent: "#col-content",
                tog: "#tog-col-menu"
            },

            events: {
                "click @ui.tog": "click_tog"
            },

            initialize: function(){
                _.bindAll(this, "resizeHandler");
                $(window).on("resize", this.resizeHandler);
                this.colMenuState = true;
                var that = this;
                this.listenTo(this.ColMenu, "show", function(){
                    that.resizeHandler();
                    // @todo: marche très mal, FF mobile sur Galaxy S5 pas reconnu par ex
                    // tester : <https://github.com/kaimallea/isMobile>
                    if(App.mobile){
                        that.click_tog();
                    }
                });
            },

            onDestroy: function(){
                console.log("destroy du MainLayout");
                $(window).off("resize", this.resizeHandler);
            },

            resizeHandler: function(){
                var col = this.ColMenu.$el;
                // var h = $(window).height() - $(col).offset().top;
                var h = $(window).height() - $(col).css('top');
                $(col).css({height: h });
            },

            click_tog: function(){
                if(this.colMenuState){
                    // $(this.ColMenu.$el).animate({'left': "-350px"}, 150);
                    $(this.ColMenu.$el).animate({'left': "-320px"}, 150);
                    $(this.ui.colContent).animate({'margin-left': 0}, 150);
                    $('span', this.ui.tog).toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
                    this.colMenuState = false;
                }else{
                    // $(this.ui.colContent).animate({'margin-left': '350px'}, 150);
                    $(this.ui.colContent).animate({'margin-left': '320px'}, 150);
                    $(this.ColMenu.$el).animate({'left': 0}, 150);
                    $('span', this.ui.tog).toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
                    this.colMenuState = true;
                }
            }

        });
    });