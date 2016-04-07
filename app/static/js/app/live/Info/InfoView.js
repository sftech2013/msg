define(['live', 'marionette', 'underscore'],
    function( App, Marionette, _ ) {

        return Marionette.ItemView.extend( {

            template: _.template( $("#tpl_info").html() ),
            tagName: 'div'

        });
    }
);
