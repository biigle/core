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

export function requestExport({chosen, description, entities, messages, post, type, url}) {
    if (chosen.length === 0) {
        return Promise.resolve();
    }

    let payload = {description, ...getEntitySelection(entities, chosen)};

    return post(url, payload).then(() => messages.success(
        `The ${type} export was requested. You will be notified when it is ready.`
    ));
}
