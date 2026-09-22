import assert from 'node:assert/strict';
import {test} from 'node:test';
import {requestVolumeExport} from '../../../resources/assets/js/sync/volumeExport.js';

function createOptions(overrides = {}) {
    return {
        chosen: [{id: 1}],
        description: '',
        entities: [{id: 1}, {id: 2}, {id: 3}],
        messages: {success() {}},
        post() {},
        url: '/api/v1/export/volumes',
        ...overrides,
    };
}

test('volume export payload uses only or except and includes the description', async () => {
    let payloads = [];
    let options = createOptions({
        description: 'For migration',
        post: (url, payload) => {
            payloads.push(payload);
            return Promise.resolve();
        },
    });

    await requestVolumeExport(options);
    options.chosen = [options.entities[0], options.entities[1]];
    await requestVolumeExport(options);
    options.chosen = options.entities;
    await requestVolumeExport(options);

    assert.deepEqual(payloads, [
        {description: 'For migration', only: [1]},
        {description: 'For migration', except: [3]},
        {description: 'For migration', except: []},
    ]);
});

test('empty volume selection does not submit a request', async () => {
    let requested = false;

    await requestVolumeExport(createOptions({
        chosen: [],
        post: () => requested = true,
    }));

    assert.equal(requested, false);
});

test('volume export posts once and acknowledges the asynchronous request', async () => {
    let requests = [];
    let acknowledgements = [];

    await requestVolumeExport(createOptions({
        messages: {success: (message) => acknowledgements.push(message)},
        post: (url, payload) => {
            requests.push({url, payload});
            return Promise.resolve();
        },
    }));

    assert.deepEqual(requests, [{
        url: '/api/v1/export/volumes',
        payload: {description: '', only: [1]},
    }]);
    assert.deepEqual(acknowledgements, [
        'The volume export was requested. You will be notified when it is ready.',
    ]);
});
