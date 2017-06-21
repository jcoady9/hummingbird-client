import Route from 'ember-route';
import get from 'ember-metal/get';
import set, { setProperties } from 'ember-metal/set';
import service from 'ember-service/inject';
import RSVP from 'rsvp';

export default Route.extend({
  intl: service(),

  model() {
    return this.modelFor('recommendations');
  },

  /**
   * Redirect the user if they're attempting to retreive a category that isn't within their
   * favorites.
   */
  afterModel(model) {
    const { slug } = this.paramsFor('recommendations.more');
    return get(model, 'userFavoritesTask').then((results) => {
      if (get(results, 'length') > 0) {
        const category = results.map(result => get(result, 'category')).find(category => (
          get(category, 'slug') === slug
        ));
        if (category !== undefined) {
          set(model, 'category', category);
          return RSVP.resolve();
        }
      }
      this.transitionTo('recommendations.index');
    });
  },

  setupController(controller) {
    this._super(...arguments);
    const { media_type: mediaType } = this.paramsFor('recommendations');
    setProperties(controller, { mediaType });
  },

  titleToken() {
    const controller = this.controllerFor(get(this, 'routeName'));
    const category = get(controller, 'category.title');
    const { media_type: mediaType } = this.paramsFor('recommendations');
    const title = get(this, 'intl').t('titles.recommendations.more', {
      category,
      mediaType
    });
    set(this, 'breadcrumb', title);
    return title;
  }
});
