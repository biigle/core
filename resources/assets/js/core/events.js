/**
 * Global event bus
 */
biigle.$declare('events', new Vue());
// Legacy support of the previous name.
biigle.$declare('biigle.events', biigle.$require('events'));
