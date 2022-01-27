<div id="volume-metadata-upload" class="panel panel-default">
    <div class="panel-heading">
        Image metadata
        <span class="pull-right"><span class="loader" v-bind:class="{'loader--active':loading}"></span></span>
    </div>
    <div class="panel-body">
        <tabs>
            <tab title="iFDO file">
                <p>
                    Upload an iFDO file to attach it to the volume and update the image metadata.
                </p>
                <form class="form" v-on:submit.prevent="submitIfdo">
                    <div class="form-group">
                        <input class="hidden" ref="ifdoInput" type="file" name="file" v-on:change="prepareIfdo" accept=".yml,.yaml">
                        <button class="btn btn-success" type="submit" :disabled="loading">Upload iFDO</button>
                    </div>
                </form>
            </tab>
            <tab title="CSV file" v-cloak>
                <p>
                    Upload a CSV file to update the metadata of the images of this volume.
                </p>
                <form class="form" v-on:submit.prevent="submitCsv">
                    <div class="form-group">
                        <input class="hidden" ref="csvInput" type="file" name="file" v-on:change="uploadCsv" accept=".csv,text/csv,application/csv">
                        <button class="btn btn-success" type="submit" :disabled="loading">Upload CSV</button>
                    </div>
                </form>
            </tab>
        </tabs>
        <div class="alert alert-danger" v-if="error" v-text="error" v-cloak></div>
        <div class="alert alert-success" v-if="success" v-cloak>
            The image metadata was successfully updated.
        </div>
        <p class="text-muted">
            Learn more about image metadata and the CSV file format in the <a href="{{route('manual-tutorials', ['volumes', 'image-metadata'])}}">manual</a>.
        </p>

    </div>
</div>
