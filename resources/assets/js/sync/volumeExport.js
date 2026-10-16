const acknowledgement = 'The volume export was requested. You will be notified when it is ready.';

export function getEntitySelection(entities, chosen) {
    if ((entities.length / 2) > chosen.length) {
        return {only: chosen.map((entity) => entity.id)};
    }

    return {
        except: entities
            .filter((entity) => chosen.indexOf(entity) === -1)
            .map((entity) => entity.id),
    };
}

export function requestVolumeExport({chosen, description, entities, messages, post, url}) {
    if (chosen.length === 0) {
        return Promise.resolve();
    }

    let payload = {description, ...getEntitySelection(entities, chosen)};

    return post(url, payload).then(() => messages.success(acknowledgement));
}
