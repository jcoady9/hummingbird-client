import Component from 'ember-component';
import get from 'ember-metal/get';
import service from 'ember-service/inject';
import computed from 'ember-computed';
import { typeOf } from 'ember-utils';
import { task } from 'ember-concurrency';

export default Component.extend({
  _currentIndex: 0,
  profileStrength: 0,
  ajax: service(),
  store: service(),
  queryCache: service(),

  currentMedia: computed('results', '_currentIndex', function() {
    return get(this, 'results').objectAt(get(this, '_currentIndex'));
  }).readOnly(),

  /**
   * Skip the initial 8 that we already show on the page.
   */
  results: computed('getRecommendationsTask.last.value', function() {
    const value = get(this, 'getRecommendationsTask.last.value') || [];
    return value.slice(8);
  }).readOnly(),

  mediaYear: computed('currentMedia.startDate', function() {
    const startDate = get(this, 'currentMedia.startDate');
    return startDate ? get(this, 'currentMedia.startDate').year() : '';
  }).readOnly(),

  didReceiveAttrs() {
    this._super(...arguments);
    get(this, 'getRecommendationsTask').perform();
  },

  getRecommendationsTask: task(function* () {
    const namespace = get(this, 'namespace');
    const path = `/recommendations/${namespace}`;
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
  }).drop(),

  actions: {
    nextMedia() {
      this.incrementProperty('_currentIndex');
    },

    rateMedia(rating) {
      const namespace = get(this, 'namespace');
      const libraryEntry = get(this, 'store').createRecord('library-entry', {
        rating,
        status: 'completed',
        user: get(this, 'session.account'),
        [namespace]: get(this, 'currentMedia')
      });
      libraryEntry.save();
      this.incrementProperty('_currentIndex');
    }
  }
});
