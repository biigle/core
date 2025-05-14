<template>
  <ul class="labelbot-labels">
    <li class="labelbot-labels-label" v-for="(label, index) in labelbotLabels" :key="index" @mouseover="handleLabelbotFocus" @click="selectLabelbotLabel(label)">
      <div v-if="index === 0" class="labelbot-labels-label__nameProgress">
        <!-- Progress bar -->
          <div v-show="progressBarWidth > -1" class="labelbot-labels-label__progress-bar" :style="{ width: progressBarWidth + '%' }" @transitionend="closeLabelbotPopup"></div>
        <!-- Label name -->
        <div class="labelbot-labels-label__nameProgressColor" :class="{ 'labelbot-labels-label__highlightedProgress': index === highlightedLabel && isFocused}">
          <span class="labelbot-labels-label__color" :style="{ backgroundColor: '#'+label.color }"></span>
          <span>{{ label.name }}</span>
        </div> 
      </div>
      <div v-else class="labelbot-labels-label__name" :class="{ 'labelbot-labels-label__highlighted': index === highlightedLabel && isFocused}">
        <span class="labelbot-labels-label__color" :style="{ backgroundColor: '#'+label.color }"></span>
        <span>{{ label.name }}</span>
      </div>
    </li>
    <li class="labelbot-labels-label">
      <typeahead :key="popupKey" ref="popupTypeahead" :style="{ width: '100%' }" :items="labels" more-info="tree.versionedName" @focus="handleLabelbotFocus" @select="selectLabelbotLabel" placeholder="Find label"></typeahead>
    </li>
  </ul>
</template>

<script>
import Typeahead from '../../label-trees/components/labelTypeahead.vue';
import Keyboard from '../../core/keyboard';

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
    },
    focusedPopupKey: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      progressBarWidth: -1,
      selectedLabel: null,
      trees: [],
      highlightedLabel: -1,
    };
  },
  computed: {
    localeCompareSupportsLocales() {
      try {
        'foo'.localeCompare('bar', 'i');
      } catch (e) {
          return e.name === 'RangeError';
      }

      return false;
    },
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
    isFocused() {
      return this.popupKey === this.focusedPopupKey;
    }
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
    selectLabelbotLabel(label) {
      // Top 1 label is already attached/selected
      if (this.selectedLabel.id !== label.id) {
        this.$emit('update-labelbot-label', {"label": label, "popupKey" : this.popupKey});
      }
      this.closeLabelbotPopup();
    },
    closeLabelbotPopup() {
      this.$refs.popupTypeahead?.clear();
      this.highlightedLabel = -1;
      this.$emit('delete-labelbot-labels', this.popupKey);
    },
    handleLabelbotFocus() {
      this.progressBarWidth = -1;
      this.$emit('change-labelbot-focused-popup', this.popupKey);
    },
    labelClose() {
      this.$nextTick(() => {
        if (this.isFocused) {
          this.highlightedLabel = -1;
          this.$emit('delete-labelbot-labels', this.popupKey);
        }
      });
    },
    labelUp() {
      this.$nextTick(() => {
        if (this.highlightedLabel > 0 && this.isFocused) {
          this.progressBarWidth = -1;
          this.highlightedLabel--;
        }
      })
    },
    labelDown() {
      this.$nextTick(() => {
        if (this.highlightedLabel < this.labelbotLabels.length && this.isFocused) {
          this.progressBarWidth = -1;
          this.highlightedLabel++;
        }

        if (this.highlightedLabel === this.labelbotLabels.length && this.isFocused) {
          this.$refs.popupTypeahead.$refs.input.focus();
        }
      });
    },
    labelEnter() {
      this.$nextTick(() => {
        if (this.highlightedLabel < this.labelbotLabels.length && this.highlightedLabel > -1 && this.isFocused) {
          this.selectLabelbotLabel(this.labelbotLabels[this.highlightedLabel]);
        }
      });
    },
    deleteLabelAnnotation() {
      this.$nextTick(() => {
        if (this.isFocused) {
          this.$refs.popupTypeahead?.clear();
          this.highlightedLabel = -1;
          this.$emit('delete-labelbot-labels-annotation', this.popupKey);
        }
      });
    }
  },
  created() {
    this.trees = biigle.$require('annotations.labelTrees');

    Keyboard.on('Escape', this.labelClose, 0, this.listenerSet);
    Keyboard.on('arrowup', this.labelUp, 0, this.listenerSet);
    Keyboard.on('arrowdown', this.labelDown, 0, this.listenerSet);
    Keyboard.on('Enter', this.labelEnter, 0, this.listenerSet);
    Keyboard.on('delete', this.deleteLabelAnnotation, 0, this.listenerSet);
  },
};
</script>