
define(['App', 'marionette', 'Themes/Edit/colorpickerinput/View'],
    function(App, Marionette, cpInputView) {

        return Marionette.CollectionView.extend({
            childView: cpInputView,
            tagName: 'div',
            className: 'row',
            
        });

    });