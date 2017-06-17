import Route from 'ember-route';
import get from 'ember-metal/get';
import service from 'ember-service/inject';
import { task } from 'ember-concurrency';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import DataErrorMixin from 'client/mixins/routes/data-error';

export default Route.extend(AuthenticatedRouteMixin, DataErrorMixin, {
  authenticationRoute: 'dashboard',
  queryCache: service(),

  /**
   * Redirect to `404` if the media type requested isn't valid.
   */
  beforeModel() {
    const { media_type: mediaType } = this.paramsFor(get(this, 'routeName'));
    if (!['anime', 'manga'].includes(mediaType)) {
      this.replaceWith('/404');
    }
  },

  model() {
    return { userFavoritesTask: get(this, 'getUserFavoritesTask').perform() };
  },

  getUserFavoritesTask: task(function* () {
    if (!get(this, 'session.hasUser')) { return; }
    return yield get(this, 'queryCache').query('category-favorite', {
      include: 'category',
      filter: { user_id: get(this, 'session.account.id') },
      fields: { categoryFavorites: 'category', categories: 'title,slug' }
    });
  }).drop(),
});
