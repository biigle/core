/**
 * Resource for uploading an IFDO file and getting content as JSON.
 *
 * let resource = parseIfdoFile;
 * let data = new FormData();
 * data.append('file', fileInputElement.files[0]);
 *
 * resource.save(data).then(...);
 */
export default Vue.resource('api/v1/volumes/parse-ifdo');
