const acknowledgement = 'The volume export was requested. You will be notified when it is ready.';

export function requestVolumeExport({chosen, description, entities, messages, post, url}) {
    if (chosen.length === 0) {
        return Promise.resolve();
    }

    let payload = {description};
    if ((entities.length / 2) > chosen.length) {
        payload.only = chosen.map((volume) => volume.id);
    } else {
        payload.except = entities
            .filter((volume) => chosen.indexOf(volume) === -1)
            .map((volume) => volume.id);
    }

    return post(url, payload).then(() => messages.success(acknowledgement));
}
