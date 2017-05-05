<sidebar-tab name="annotations" icon="map-marker" title="Toggle the annotations list" class="sidebar__tab--nopad">
    <annotations-tab :annotations="currentAnnotations" v-cloak inline-template>
        <div class="annotations-tab">
            <ul class="list-unstyled">
                <label-item v-for="item in items" :item="item" inline-template>
                    <li class="annotations-tab-item" :class="classObject" :title="title">
                        <div class="annotations-tab-item__title">
                            <span class="pull-right" v-text="count" :title="countTitle"></span>
                            <span class="annotations-tab-item__color" :style="colorStyle"></span> <span v-text="label.name"></span>
                        </div>
                    </li>
                </label-item>
            </ul>
        </div>
    </annotations-tab>
</sidebar-tab>
