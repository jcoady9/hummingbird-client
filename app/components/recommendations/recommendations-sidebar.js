import Component from 'ember-component';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import service from 'ember-service/inject';
import { capitalize } from 'ember-string';
import { task, timeout } from 'ember-concurrency';

const TICKER_TIMEOUT_MS = 10000;

export default Component.extend({
  tagName: '',
  profileStrength: 0,
  ajax: service(),

  didReceiveAttrs() {
    this._super(...arguments);
    get(this, 'getProfileStrengthTask').perform();
  },

  getProfileStrengthTask: task(function* () {
    const path = `/users/${get(this, 'session.account.id')}/_strength`;
    while (true) {
      const response = yield get(this, 'ajax').request(path);
      const namespace = get(this, 'namespace');
      set(this, 'profileStrength', get(response, capitalize(namespace)) || 0);
      yield timeout(TICKER_TIMEOUT_MS);
    }
  }).drop()
});
