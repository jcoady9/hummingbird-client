import Component from 'ember-component';
import get from 'ember-metal/get';
import service from 'ember-service/inject';
import { typeOf } from 'ember-utils';
import computed from 'ember-computed';
import { task } from 'ember-concurrency';

export default Component.extend({
  classNames: ['media-recommendations'],
  ajax: service(),
  store: service(),
  queryCache: service(),

  results: computed('getRecommendationsTask.last.value', 'category', function() {
    let content = get(this, 'getRecommendationsTask.last.value') || [];
    if (get(this, 'category') !== undefined) {
      content = content.find(recommendation => (
        get(recommendation, 'category.slug') === get(this, 'category.slug')
      ));
      content = content ? get(content, 'media') : [];
    }
    const limit = get(this, 'limit');
    return content.slice(0, limit);
  }).readOnly(),

  didReceiveAttrs() {
    this._super(...arguments);
    get(this, 'getRecommendationsTask').perform();
  },

  getRecommendationsTask: task(function* () {
    const isCategory = get(this, 'category') !== undefined;
    if (isCategory) {
      return yield get(this, '_getCategoryRecommendationsTask').perform();
    }
    return yield get(this, '_getMediaRecommendationsTask').perform();
  }).drop(),

  _getMediaRecommendationsTask: task(function* () {
    const namespace = get(this, 'namespace');
    const path = `/recommendations/${namespace}`;
    return yield get(this, '_makeRequestTask').perform(path);
  }).drop(),

  _getCategoryRecommendationsTask: task(function* () {
    const namespace = get(this, 'namespace');
    const path = `/category_recommendations/${namespace}`;
    return yield get(this, '_makeRequestTask').perform(path);
  }).drop(),

  _makeRequestTask: task(function* (path) {
    const namespace = get(this, 'namespace');
    // try get a cached entry
    const cachedRecords = yield get(this, 'queryCache').get('recommendations', path);
    if (cachedRecords) {
      return cachedRecords;
    }

    // query the API & push into cache
    const response = yield get(this, 'ajax').request(path);
    if (typeOf(response.data) !== 'array') {
      return [];
    }
    const records = [];
    response.data.forEach((data) => {
      const normalize = get(this, 'store').normalize(namespace, data);
      const record = get(this, 'store').push(normalize);
      records.pushObject(record);
    });

    get(this, 'queryCache').push('recommendations', path, records);
    return records;
  }).drop()
});
