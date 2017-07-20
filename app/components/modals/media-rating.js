import Component from 'ember-component';
import get from 'ember-metal/get';
import computed from 'ember-computed';
import { htmlSafe } from 'ember-string';
import { invokeAction } from 'ember-invoke-action';
import { image } from 'client/helpers/image';

export default Component.extend({
  classNames: ['rating-modal'],

  posterImageStyle: computed('media.posterImage', function() {
    const posterImage = image(get(this, 'media.posterImage'), 'medium');
    return htmlSafe(`background-image: url("${posterImage}")`);
  }).readOnly(),

  didReceiveAttrs() {
    this._super(...arguments);
  },

  actions: {
    onSkip() {
      invokeAction(this, 'onSkip');
    },

    onRating(rating) {
      invokeAction(this, 'onRating', rating);
    }
  }
});
