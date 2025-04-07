<template>
  <ul class="labelbot-labels">
    <li class="labelbot-labels-label" v-for="(label, index) in labelbotLabels" :key="index">
      <div v-if="index === 0" class="labelbot-labels-label__nameProgress" @click="selectLabel(label)">
        <!-- Progress bar -->
          <div v-show="progressBarWidth > -1" class="labelbot-labels-label__progress-bar" :style="{ width: progressBarWidth + '%' }" @transitionend="closeLabelBOTPopup()"></div>
        <!-- Label name -->
        <div class="labelbot-labels-label__nameProgressColor">
          <span class="labelbot-labels-label__color" :style="{ backgroundColor: '#'+label.color }"></span>
          <span>{{ label.name }}</span>
        </div> 
      </div>
      <div v-else class="labelbot-labels-label__name" @click="selectLabel(label)">
        <span class="labelbot-labels-label__color" :style="{ backgroundColor: '#'+label.color }"></span>
        <span>{{ label.name }}</span>
      </div>
    </li>
    <li class="labelbot-labels-label">
      <typeahead ref="typeahead" :items="labels" more-info="tree.versionedName" @focus="resetProgressBarWidth" @select="selectLabel" placeholder="Find label"></typeahead>
    </li>
  </ul>
</template>

<script>
import Typeahead from '../../label-trees/components/labelTypeahead.vue';

export default {
  components: {
    typeahead: Typeahead,
  },
  props: {
    labelbotLabels: {
      type: Array,
      required: true,
    },
    popupKey: {
      type: Number,
      required: true,
    }
  },
  data() {
    return {
      progressBarWidth: -1,
      selectedLabel: null,
      trees: [],
    };
  },
  computed: {
    labels() {
        let labels = [];
        this.trees.forEach(function (tree) {
            Array.prototype.push.apply(labels, tree.labels);
        });

        if (this.localeCompareSupportsLocales) {
            let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
            labels.sort(function (a, b) {
                return collator.compare(a.name, b.name);
            });
        } else {
            labels.sort(function (a, b) {
                return a.name < b.name ? -1 : 1;
            });
        }

        return labels;
    },
  },
  watch: {
    labelbotLabels() {
      this.progressBarWidth = 0;
      if (this.labelbotLabels.length > 0) {
        this.selectedLabel = this.labelbotLabels[0];
        setTimeout(() => this.progressBarWidth = 100, 10);
      }
    },
  },
  methods: {
    selectLabel(label) {
      // Top 1 label is already attached/selected
      if (this.selectedLabel.id !== label.id) {
        this.$emit('update-labelbot-label', {"label": label, "popupKey" : this.popupKey});
      }
      this.closeLabelBOTPopup();
    },
    closeLabelBOTPopup() {
      this.$emit('delete-labelbot-labels', this.popupKey);
    },
    resetProgressBarWidth() {
      this.progressBarWidth = -1;
    },
  },
  created() {
    this.trees = biigle.$require('annotations.labelTrees');
  },
};
</script>