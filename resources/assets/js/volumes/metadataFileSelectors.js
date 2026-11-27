/**
 * Custom file selectors for metadata parsers.
 *
 * By default, selecting a metadata parser opens the file picker of the browser. A
 * module can replace this for its own parser (e.g. to let the user choose several files
 * and combine them into the single file that BIIGLE expects) by registering a selector
 * function in the 'volumes.metadataFileSelectors' namespace, using the class name of
 * the parser as the key:
 *
 *     biigle.$require('volumes.metadataFileSelectors')[parserClass] = async (parser) => {
 *         // Let the user choose the files and return the resulting File.
 *         // Return null if the user cancelled.
 *     };
 *
 * The returned file is handled exactly like a file chosen with the file picker.
 */

/**
 * Get the custom file selector of a parser, if a module registered one.
 *
 * @param {Object} parser Parser object with the 'parserClass' property.
 *
 * @returns {Function|null}
 */
export function getFileSelector(parser) {
    let selectors = biigle.$require('volumes.metadataFileSelectors');
    if (
        parser &&
        Object.prototype.hasOwnProperty.call(selectors, parser.parserClass) &&
        typeof selectors[parser.parserClass] === 'function'
    ) {
        return selectors[parser.parserClass];
    }

    return null;
}
