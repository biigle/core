/**
 * @namespace dias.annotations
 * @ngdoc service
 * @name mapInteractions
 * @memberOf dias.annotations
 * @description Manages all the (default) OpenLayers interactions of the annotator
 */
angular.module('dias.annotations').service('mapInteractions', function (map, styles, AttachLabelInteraction, ExtendedTranslateInteraction) {
    "use strict";

    var _this = this;

    var interactions = {};

    var constructors = {
        // select interaction working on "singleclick"
        select: function (name, layers) {
            interactions.select = new ol.interaction.Select({
                style: styles.highlight,
                layers: layers,
                // enable selecting multiple overlapping features at once
                multi: true
            });

            return interactions.select;
        },
        modify: function (name, features) {
            interactions.modify = new ol.interaction.Modify({
                features: features,
                // the SHIFT key must be pressed to delete vertices, so
                // that new vertices can be drawn at the same position
                // of existing vertices
                deleteCondition: function(event) {
                    return ol.events.condition.shiftKeyOnly(event) &&
                        ol.events.condition.singleClick(event);
                }
            });

            return interactions.modify;
        },
        draw: function (name, type, source) {
            interactions.draw = new ol.interaction.Draw({
                source: source,
                type: type,
                style: styles.editing
            });

            return interactions.draw;
        },
        // interaction for moving annotations
        translate: function (name, features) {
            interactions.translate = new ExtendedTranslateInteraction({
                features: features
            });

            return interactions.translate;
        },
        // interaction to attach labels to existing annotations
        attachLabel: function (name, features) {
            interactions.attachLabel = new AttachLabelInteraction({
                features: features
            });

            return interactions.attachLabel;
        }
    };

    // listeners for the change:active event of the interactions
    var toggle = {
        select: function (e) {
            e.target.getFeatures().clear();
        },
        draw: function (e) {
            if (e.oldValue) {
                remove('draw');
                deactivate('modify');
                activate('select');
            } else {
                add('draw');
                deactivate('select');
                deactivate('translate');
                deactivate('attachLabel');
                activate('modify');
            }
        },
        translate: function (e) {
            if (!e.oldValue) {
                deactivate('draw');
                deactivate('attachLabel');
            }
        },
        attachLabel: function (e) {
            if (!e.oldValue) {
                deactivate('draw');
                deactivate('translate');
            }
        }
    };

    var exists = function (name) {
        return interactions.hasOwnProperty(name);
    };

    var get = function (name) {
        return interactions[name];
    };

    var activate = function (name) {
        if (exists(name)) {
            interactions[name].setActive(true);
        }
    };

    var deactivate = function (name) {
        if (exists(name)) {
            interactions[name].setActive(false);
        }
    };

    var active = function (name) {
        return exists(name) && interactions[name].getActive();
    };

    var add = function (name) {
        if (exists(name)) {
            map.addInteraction(interactions[name]);
        }
    };

    var remove = function (name) {
        if (exists(name)) {
            map.removeInteraction(interactions[name]);
        }
    };

    var on = function (name, event, callback) {
        if (exists(name)) {
            interactions[name].on(event, callback);
        }
    };

    var un = function (name, event, callback) {
        if (exists(name)) {
            interactions[name].on(event, callback);
        }
    };

    var init = function (name) {
        deactivate(name);
        remove(name);

        var i = constructors[name].apply(_this, arguments);
        add(name);

        if (toggle.hasOwnProperty(name)) {
            on(name, 'change:active', toggle[name]);
            // call the toggle function initially
            toggle[name]({key: 'active', target: i});
        }

        return i;
    };

    this.get = get;
    this.activate = activate;
    this.deactivate = deactivate;
    this.active = active;
    this.add = add;
    this.remove = remove;
    this.on = on;
    this.un = un;
    this.init = init;
});
