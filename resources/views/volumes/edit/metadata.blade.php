<div id="volume-metadata-upload" class="panel panel-default">
    <div class="panel-heading">
        @if ($volume->isImageVolume())
            Image metadata
        @else
            Video metadata
        @endif
        <span class="pull-right">
            <span class="loader" v-bind:class="{'loader--active':loading}"></span>
            <dropdown tag="span" v-if="hasMetadata" v-cloak>
                <button class="btn btn-default btn-xs dropdown-toggle" type="button" title="Manage the metadata file attached to this volume" :disabled="loading"><i class="fa fa-file-alt"></i> Manage file <span class="caret"></span></button>
                <template slot="dropdown">
                    <li>
                        <a href="{{url("api/v1/volumes/{$volume->id}/metadata")}}" title="Download the metadata file">Download</a>
                    </li>
                    <li>
                        <a href="#" title="Delete the metadata file" v-on:click.prevent="deleteFile">Delete</a>
                    </li>
                </template>
            </dropdown>
        </span>
    </div>
    <div class="panel-body">
        <p>
            Upload a metadata file to attach it to the volume and update the @if ($volume->isImageVolume()) image @else video @endif metadata.
        </p>
        <p class="text-center">
            <dropdown tag="span">
                <button class="btn btn-default dropdown-toggle" type="button" :disabled="loading"><i class="fa fa-file-alt"></i> Upload file <span class="caret"></span></button>
                <template slot="dropdown">
                    <li v-for="parser in parsers">
                        <a href="#" v-on:click.prevent="selectFile(parser)" v-text="parser.name"></a>
                    </li>
                </template>
            </dropdown>
        </p>

        <input class="hidden" ref="fileInput" type="file" name="file" v-on:change="handleFile" :accept="selectedParser?.mimeTypes">

        <div class="alert alert-danger" v-if="error" v-text="error" v-cloak></div>
        <div class="alert alert-success" v-if="success" v-cloak>
            The @if ($volume->isImageVolume()) image @else video @endif metadata file was successfully updated.
        </div>
        <p class="text-muted">
            Learn more about @if ($volume->isImageVolume()) image @else video @endif metadata and the file formats in the <a href="{{route('manual-tutorials', ['volumes', 'file-metadata'])}}">manual</a>.
        </p>
    </div>
</div>
