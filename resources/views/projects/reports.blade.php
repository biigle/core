@extends('projects.show.base')

@section('title', "Reports for {$project->name}")

@push('scripts')
<script type="text/javascript">
    biigle.$declare('reports.projectId', {!! $project->id !!});
    biigle.$declare('reports.reportTypes', {!! $reportTypes !!});
    biigle.$declare('reports.labelTrees', {!! $labelTrees !!});
</script>
@endpush

@section('project-content')
<div id="project-report-form" class="container">
    <p>
        Request a project report to consolidate data of image or video volumes of the project into downloadable files.
    </p>
    <form v-on:submit.prevent="submit">
        <div class="row">
            <div class="col-xs-6">
                <div class="form-group">
                    <label>Report type</label>
                    @if ($hasImageVolume)
                        <div class="btn-group btn-group-justified">
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Request an annotation report" v-on:click="selectType('ImageAnnotations')" :class="{active: wantsType('ImageAnnotations')}">Image annotation report</button>
                            </div>
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Request an image label report" v-on:click="selectType('ImageLabels')" :class="{active: wantsType('ImageLabels')}">Image label report</button>
                            </div>
                            <div class="btn-group">
                                @if ($hasIfdos)
                                    <button type="button" class="btn btn-default" title="Request an image iFDO report" v-on:click="selectType('ImageIfdo')" :class="{active: wantsType('ImageIfdo')}">Image iFDO report</button>
                                @else
                                    <button type="button" class="btn btn-default" title="iFDO reports are only available for projects having volumes with attached iFDO files" disabled>Image iFDO report</button>
                                @endif
                            </div>
                        </div>
                    @endif
                @if ($hasImageVolume && $hasVideoVolume)
                </div>
                <div class="form-group">
                @endif
                    @if ($hasVideoVolume)
                        <div class="btn-group btn-group-justified">
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Request a video annotation report" v-on:click="selectType('VideoAnnotations')" :class="{active: wantsType('VideoAnnotations')}">Video annotation report</button>
                            </div>
                            <div class="btn-group">
                                <button type="button" class="btn btn-default" title="Request a video label report" v-on:click="selectType('VideoLabels')" :class="{active: wantsType('VideoLabels')}">Video label report</button>
                            </div>
                            <div class="btn-group">
                                @if ($hasIfdos)
                                    <button type="button" class="btn btn-default" title="Request a video iFDO report" v-on:click="selectType('VideoIfdo')" :class="{active: wantsType('VideoIfdo')}">Video iFDO report</button>
                                @else
                                    <button type="button" class="btn btn-default" title="iFDO reports are only available for projects having volumes with attached iFDO files" disabled>Video iFDO report</button>
                                @endif
                            </div>
                        </div>
                    @endif
                </div>
                <div class="form-group" :class="{'has-error': errors.id}">
                    <div v-if="hasAvailableVariants">
                        <label for="report-variant">Report variant</label>
                        <select id="report-variant" class="form-control" v-model="selectedVariant" required="" :disabled="onlyOneAvailableVariant">
                            <option v-for="variant in availableVariants" :value="variant" v-text="variant"></option>
                        </select>
                    </div>
                    @include('partials.reportTypeInfo')
                    <div class="help-block" v-if="errors.id" v-text="getError('id')"></div>
                </div>
                <div class="alert alert-success" v-if="success" v-cloak>
                    The requested report will be prepared. You will get notified when it is ready.
                </div>
                <div class="form-group clearfix">
                    <button class="btn btn-success pull-right" type="submit" :disabled="loading">Request this report</button>
                </div>
            </div>
            <div class="col-xs-6">
                <div v-cloak v-if="hasOption('export_area')" class="form-group" :class="{'has-error': errors.export_area}">
                    <div class="checkbox">
                        @if ($hasExportArea)
                            <label>
                                <input type="checkbox" v-model="options.export_area"> Restrict to export area
                            </label>
                        @else
                            <label class="text-muted">
                                <input type="checkbox" v-model="options.export_area" disabled> Restrict to export area
                            </label>
                        @endif
                    </div>
                    <div v-if="errors.export_area" v-cloak class="help-block" v-text="getError('export_area')"></div>
                    <div v-else class="help-block">
                        Annotations that are outside of the export area will be discarded for this report.
                    </div>
                </div>
                <div v-cloak v-if="hasOption('newest_label')" :class="{'has-error': errors.newest_label}">
                    <div class="checkbox">
                        <label :class="{'text-muted': options.all_labels}">
                            <input type="checkbox" v-model="options.newest_label" :disabled="options.all_labels"> Restrict to newest label
                        </label>
                    </div>
                    <div v-if="errors.newest_label" v-cloak class="help-block" v-text="getError('newest_label')"></div>
                    <div v-else class="help-block">
                        Only the newest label of each annotation will be included in the report.
                    </div>
                <div v-cloak v-if="wantsCombination('ImageAnnotations', 'Abundance')" class="form-group" :class="{'has-error': errors.aggregate_child_labels}">
                    <div class="checkbox">
                        <label :class="{'text-muted': options.all_labels}">
                            <input type="checkbox" v-model="options.aggregate_child_labels" :disabled="options.all_labels"> Aggregate child labels
                        </label>
                    </div>
                    <div v-if="errors.aggregate_child_labels" v-cloak class="help-block" v-text="getError('aggregate_child_labels')"></div>
                    <div v-else class="help-block">
                        Aggregate the abundance of child labels to their parent label.
                    </div>
                </div>
                <div v-cloak v-if="hasOption('separate_label_trees')" class="form-group" :class="{'has-error': errors.separate_label_trees}">
                    <div class="row">
                        <div class="col-xs-6">
                            <div class="checkbox">
                                <label>
                                    <input type="checkbox" v-model="options.separate_label_trees"> Separate label trees
                                </label>
                            </div>
                        </div>
                        <div class="col-xs-6">
                            <div class="checkbox">
                                <label>
                                    <input type="checkbox" v-model="options.separate_users"> Separate users
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="help-block" v-if="errors.separate_label_trees" v-cloak v-text="getError('separate_label_trees')"></div>
                    <div class="help-block" v-if="errors.separate_users" v-cloak v-text="getError('separate_users')"></div>
                    <div v-if="!errors.separate_label_trees && !errors.separate_users" class="help-block">
                        Split the report to separate files/sheets for label trees or users.
                    </div>
                </div>
                <div v-cloak v-if="hasOption('strip_ifdo')" class="form-group" :class="{'has-error': errors.strip_ifdo}">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox" v-model="options.strip_ifdo"> Strip original annotations
                        </label>
                    </div>
                    <div v-if="errors.strip_ifdo" v-cloak class="help-block" v-text="getError('strip_ifdo')"></div>
                    <div v-else class="help-block">
                        Only include BIIGLE annotations in the iFDO files.
                    </div>
                </div>
                @include('partials.restrictLabels')
                <div v-cloak v-if="wantsCombination('ImageAnnotations', 'Abundance')" class="form-group" :class="{'has-error': errors.all_labels}">
                    <div class="checkbox">
                        <label :class="{'text-muted': disableAllLabelsOption}">
                            <input type="checkbox" v-model="options.all_labels" :disabled="disableAllLabelsOption"> Include all volume labels
                        </label>
                    </div>
                        <div v-if="errors.all_labels" v-cloak class="help-block" v-text="getError('all_labels')"></div>
                        <div v-else class="help-block">
                            Include all labels that can be used in a volume.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>
@endsection
