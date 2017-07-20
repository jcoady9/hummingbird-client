import Component from 'ember-component';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import service from 'ember-service/inject';
import { reads } from 'ember-computed';
import { camelize } from 'ember-string';
import { invoke, invokeAction } from 'ember-invoke-action';
import { task } from 'ember-concurrency';
import { LIBRARY_STATUSES } from 'client/models/library-entry';

export default Component.extend({
  ajax: service(),
  store: service(),
  ratings: reads('getIssuesTask.last.value.rating'),
  reactions: reads('getIssuesTask.last.value.reaction'),

  init() {
    this._super(...arguments);
    this.mediaOptions = ['anime', 'manga'];
  },

  didReceiveAttrs() {
    this._super(...arguments);
    get(this, 'preloadIssuesTask').perform();

    if (!get(this, 'counts')) { return; }
    // Build object of `{ status: count }` as the API only ships down values > 0.
    const counts = LIBRARY_STATUSES.reduce((previous, current) => {
      const status = camelize(current);
      const value = get(this, `counts.${status}`) || 0;
      return { ...previous, [current]: value };
    }, {});
    set(this, 'libraryCounts', counts);

    // Sum all values for total count
    const total = Object.values(counts).reduce((previous, current) => previous + current, 0);
    set(this, 'totalCount', total);
  },

  getIssuesTask: task(function* () {
    return yield get(this, 'ajax').request('/library-entries/_issues');
  }).drop(),

  preloadIssuesTask: task(function* () {
    yield get(this, 'getIssuesTask').perform();
    yield this.preloadRatings();
    yield this.preloadReactions();
  }).drop(),

  getLibraryEntryTask: task(function* (content) {
    const libraryEntryId = get(this, `${content}.firstObject`);
    return yield this._getLibraryEntry(libraryEntryId);
  }).drop(),

  preloadRatings() {
    return this._preloadLibraryEntry('ratings', 'ratingIndex', (libraryEntry) => {
      set(this, 'nextRatingLibraryEntry', libraryEntry);
    });
  },

  preloadReactions() {
    return this._preloadLibraryEntry('reactions', 'reactionIndex', (libraryEntry) => {
      set(this, 'nextReactionLibraryEntry', libraryEntry);
    });
  },

  actions: {
    resetLibrary(...args) {
      set(this, 'isResetLoading', true);
      invokeAction(this, 'resetLibrary', ...args).finally(() => {
        set(this, 'isResetLoading', false);
      });
    },

    openRatingModal() {
      if (!get(this, 'ratingLibraryEntry')) {
        set(this, 'ratingLibraryEntry', get(this, 'nextRatingLibraryEntry'));
      }
      this.preloadRatings();
      set(this, 'showRatingModal', true);
    },

    skipRating() {
      if (get(this, 'ratings.length') === 1) {
        set(this, 'showRatingModal', false);
      } else {
        set(this, 'ratingLibraryEntry', get(this, 'nextRatingLibraryEntry'));
        this.preloadRatings();
      }
    },

    onRating(libraryEntry, rating) {
      this.decrementProperty('ratingsCount');
      set(libraryEntry, 'rating', rating);
      libraryEntry.save();
      invoke(this, 'skipRating');
    },

    openReactionModal() {
      if (!get(this, 'reactionLibraryEntry')) {
        set(this, 'reactionLibraryEntry', get(this, 'nextReactionLibraryEntry'));
      }
      this.preloadReactions();
      set(this, 'showReactionModal', true);
    },

    onReaction(isSkip = false) {
      if (!isSkip) {
        this.decrementProperty('reactionsCount');
      }
      set(this, 'reactionLibraryEntry', get(this, 'nextReactionLibraryEntry'));
      this.preloadReactions();
    }
  },

  _getLibraryEntry(libraryEntryId) {
    return get(this, 'store').findRecord('library-entry', libraryEntryId, {
      include: 'anime,manga'
    });
  },

  _preloadLibraryEntry(content, index, func) {
    return get(this, 'getLibraryEntryTask').perform(content, index).then((libraryEntry) => {
      func(libraryEntry);
    }).catch(() => {});
  }
});
