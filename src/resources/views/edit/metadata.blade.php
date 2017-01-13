<div id="volume-metadata-upload" class="panel panel-default">
    <div class="panel-heading">
        Image metadata
        <span class="pull-right"><span class="loader" v-bind:class="{'loader--active':loading}"></span></span>
    </div>
    <div class="panel-body">
        <p>
            Here you can upload a CSV file with image metadata such as the date and time when an image was taken or the geo coordinates.
        </p>
        <form class="form" v-on:submit.prevent="submit">
            <div class="form-group">
                <input type="file" name="file" v-on:change="setCsv">
                <p class="help-block">
                    See the <a href="{{route('manual-tutorials', ['volumes', 'image-metadata'])}}">manual</a> on how the CSV file should look like.
                </p>
            </div>
            <div class="alert alert-danger" v-if="error" v-text="error" v-cloak></div>
            <div class="alert alert-success" v-if="success" v-cloak>
                The image metadata was successfully updated.
            </div>
            <input class="btn btn-success" type="submit" name="submit" value="Upload" disabled :disabled="!csv || loading" v-if="!success">
        </form>
    </div>
</div>
