import Component from 'ember-component';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import service from 'ember-service/inject';
import { capitalize } from 'ember-string';
import { task, taskGroup } from 'ember-concurrency';

export default Component.extend({
  isDisabled: false,
  isInLibrary: false,

  metrics: service(),
  store: service(),
  tasks: taskGroup().drop(),

  createLibraryEntryTask: task(function* (status, rating = null) {
    const media = get(this, 'media');
    const mediaType = get(media, 'modelType');
    const libraryEntry = get(this, 'store').createRecord('library-entry', {
      status,
      rating,
      [mediaType]: media,
      user: get(this, 'session.account')
    });
    yield libraryEntry.save();
    set(this, 'libraryEntry', libraryEntry);
    set(this, 'isInLibrary', true);
  }).group('tasks'),

  saveLibraryEntryTask: task(function* (changeset) {
    yield changeset.save();
    get(this, 'queryCache').invalidateType('library-entry');
  }).group('tasks'),

  removeLibraryEntryTask: task(function* (libraryEntry) {
    try {
      yield libraryEntry.destroyRecord();
    } catch (_error) {
      libraryEntry.rollbackAttributes();
    }
  }).group('tasks'),

  actions: {
    /**
     * Tell Stream (Who handles our recommendations) that the user has `rejected` this specific
     * media.
     */
    notInterested() {
      const media = get(this, 'media');
      const mediaType = capitalize(get(media, 'modelType'));
      get(this, 'metrics').invoke('trackEngagement', 'Stream', {
        label: 'rejected',
        content: `${mediaType}:${get(media, 'id')}`
      });
      set(this, 'isDisabled', true);
    }
  }
});
