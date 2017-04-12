/**
 * Store for the volume image sorters
 */
biigle.$declare('volumes.stores.sorters', [
    // default sorters
    {
        id: 'filename',
        getComponent: function () {
            return {
                mixins: [biigle.$require('volumes.mixins.sortComponent')],
                data: function () {
                    return {
                        title: 'Sort images by filename',
                        text: 'Filename',
                        id: 'filename',
                    };
                },
                methods: {
                    getSequence: function () {
                        return new Vue.Promise(function (resolve) {
                            resolve(biigle.$require('volumes.imageIds'));
                        });
                    },
                }
            };
        },
    },
    {
        id: 'random',
        getComponent: function () {
            return {
                mixins: [biigle.$require('volumes.mixins.sortComponent')],
                data: function () {
                    return {
                        title: 'Sort images randomly',
                        text: 'Random',
                        id: 'random',
                    };
                },
                methods: {
                    // Durstenfeld shuffle
                    // see: http://stackoverflow.com/a/12646864/1796523
                    shuffle: function (array) {
                        var i, j, temp;
                        for (i = array.length - 1; i > 0; i--) {
                            j = Math.floor(Math.random() * (i + 1));
                            temp = array[i];
                            array[i] = array[j];
                            array[j] = temp;
                        }
                        return array;
                    },
                    getSequence: function () {
                        var ids = this.shuffle(biigle.$require('volumes.imageIds').slice());
                        return new Vue.Promise(function (resolve) {
                            resolve(ids);
                        });
                    },
                    handleClick: function () {
                        // Emit the event even if active so a new random sequence is
                        // generated.
                        this.$emit('select', this);
                    },
                }
            };
        },
    },
]);
