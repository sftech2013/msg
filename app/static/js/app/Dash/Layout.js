
define( [ 'App', 'marionette', 'underscore', 'text!Dash/layout.html'],

    function( App, Marionette, _, tplDash) {

        return Marionette.LayoutView.extend( {
            
            template: _.template(tplDash),
            // className: 'Dash',
            
            regions: {
                DashMaster: "#DashMaster",
                DashBoard: "#DashBoard"
            },

            initialize: function(){
                this.listenTo(App.vent, 'dashboard:scroll:left', this.scrollLeft);
                this.listenTo(App.vent, 'dashboard:scroll:right', this.scrollRight);
            },

            scrollLeft: function(){
                this._scrollDashboard('left');
            },

            scrollRight: function(){
                this._scrollDashboard('right');
            },

            _scrollDashboard: function(orientation){            
                var DBel = this.DashBoard.$el;
                // @todo: très moyen le calcul de la taille des cols ...
                var colsize = $(".col-sm-x", DBel).first().outerWidth();
                switch(orientation){
                    default:
                    case 'right':
                        $(DBel).scrollTo('+='+colsize, 300);
                        break;
                    case 'left':
                        $(DBel).scrollTo('-='+colsize, 300);
                        break;
                }
            },

        });
    });