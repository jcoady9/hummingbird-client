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

  results: computed('getRecommendationsTask.last.value', function() {
    const limit = get(this, 'category') ? 4 : 8;
    return get(this, 'getRecommendationsTask.last.value').slice(0, limit);
  }).readOnly(),

  didReceiveAttrs() {
    this._super(...arguments);
    get(this, 'getRecommendationsTask').perform();
  },

  getRecommendationsTask: task(function* () {
    const namespace = get(this, 'namespace');
    let path = `/recommendations/${namespace}`;
    const isCategory = get(this, 'category') !== undefined;


    // Switch to a category request if this is category is passed in.
    if (isCategory) {
      path = `/category_recommendations/${namespace}`;
    }

    // try get a cached entry
    const cachedRecords = yield get(this, 'queryCache').get('recommendations', path);
    if (cachedRecords) {
      return cachedRecords;
    }

    // query the API
    const response = yield get(this, 'ajax').request(path);
    if (typeOf(response.data) !== 'array') {
      return [];
    }
    const records = [];
    response.data.forEach((data) => {
      const normalize = get(this, 'store').normalize(namespace, data);
      const record = get(this, 'store').push(normalize);
      // Category endpoint returns a `CategoryRecommendation` model. We want the results to only
      // include the media however.
      if (isCategory) {
        const mediaList = record.hasMany('media').value();
        (mediaList || []).forEach((media) => {
          records.pushObject(media);
        });
      } else {
        records.pushObject(record);
      }
    });

    // push into cache
    get(this, 'queryCache').push('recommendations', path, records);
    return records;
  }).drop()
});
