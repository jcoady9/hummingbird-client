import Route from 'ember-route';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import service from 'ember-service/inject';

export default Route.extend({
  intl: service(),

  model() {
    return this.modelFor('recommendations');
  },

  setupController(controller) {
    this._super(...arguments);
    const { media_type: mediaType } = this.paramsFor('recommendations');
    set(controller, 'mediaType', mediaType);
  },

  titleToken() {
    const { media_type: mediaType } = this.paramsFor('recommendations');
    return get(this, 'intl').t('titles.recommendations.index', { mediaType });
  }
});
