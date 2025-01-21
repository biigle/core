<div id="file-panel">
    <div class="panel panel-default volume-files-panel" :class="classObject">
        <div class="panel-heading">
            Volume {{$type}}s
            <span class="pull-right">
                <loader :active="loading"></loader>
                <button class="btn btn-default btn-xs" title="Add new {{$type}}s" v-on:click="toggleEditing" :class="{active: editing}"><span class="fa fa-plus" aria-hidden="true"></span></button>
            </span>
        </div>
        <div class="panel-body" v-if="editing" v-cloak>
            <form role="form" class="form-inline" v-on:submit.prevent="submit">
                <div class="form-group" :class="{'has-error':hasError('files')}">
                    <label>Filename(s):&nbsp;</label>
                    @if ($volume->isImageVolume())
                        <input type="text" class="form-control" name="filename" id="files" placeholder="1.jpg, 2.jpg, 3.jpg" v-model="filenames" required>
                    @else
                        <input type="text" class="form-control" name="filename" id="files" placeholder="1.mp4, 2.mp4, 3.mp4" v-model="filenames" required>
                    @endif
                    <button type="submit" class="btn btn-success" :disabled="loading">Add {{$type}}(s)</button>
                    <p class="help-block" v-text="getError('files')" v-if="hasError('files')"></p>
                    <span v-else class="help-block">Mutliple files may be added by submitting the filenames as comma separated values.</span>
                </div>
            </form>
        </div>
        <ul class="list-group files-list" v-cloak>
            <file-item v-for="file in orderedFiles" :key="file.id" :file="file" :type="type" v-on:remove="handleRemove"></file-item>
            <li class="list-group-item text-muted" v-if="hasNoFiles">This volume has no {{$type}}s. <a v-if="!editing" href="#" v-on:click.prevent="toggleEditing">Add some.</a></li>
        </ul>
    </div>
</div>
