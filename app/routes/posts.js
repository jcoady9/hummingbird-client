import Route from 'ember-route';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import service from 'ember-service/inject';
import DataErrorMixin from 'client/mixins/routes/data-error';
import clip from 'clip';

export default Route.extend(DataErrorMixin, {
  i18n: service(),
  metrics: service(),

  model({ id }) {
    return get(this, 'store').findRecord('post', id, {
      include: 'user,targetUser,media',
      reload: true
    });
  },

  afterModel(model) {
    set(this, 'breadcrumb', `Post by ${get(model, 'user.name')}`);
    this.setHeadTags(model);
    get(this, 'metrics').invoke('trackImpression', 'Stream', {
      content_list: [`Post:${get(model, 'id')}`],
      location: get(this, 'routeName')
    });
  },

  titleToken() {
    const model = this.modelFor('posts');
    const name = get(model, 'user.name');
    return get(this, 'i18n').t('titles.posts', { user: name });
  },

  setHeadTags(model) {
    const desc = clip(get(model, 'content'), 400);
    const data = [{
      type: 'meta',
      tagId: 'meta-description',
      attrs: {
        name: 'description',
        content: desc
      }
    }, {
      type: 'meta',
      tagId: 'meta-og-description',
      attrs: {
        property: 'og:description',
        content: desc
      }
    }, {
      type: 'meta',
      tagId: 'meta-og-image',
      attrs: {
        property: 'og:image',
        content: get(model, 'user.avatar.medium')
      }
    }];
    if (get(model, 'postLikesCount')) {
      data.push({
        type: 'meta',
        tagId: 'meta-twitter-label1',
        attrs: {
          property: 'twitter:label1',
          content: 'Likes'
        }
      }, {
        type: 'meta',
        tagId: 'meta-twitter-data1',
        attrs: {
          property: 'twitter:data1',
          content: `${get(model, 'postLikesCount')}`
        }
      });
    }
    if (get(model, 'commentsCount')) {
      data.push({
        type: 'meta',
        tagId: 'meta-twitter-label2',
        attrs: {
          property: 'twitter:label2',
          content: 'Comments'
        }
      }, {
        type: 'meta',
        tagId: 'meta-twitter-data2',
        attrs: {
          property: 'twitter:data2',
          content: get(model, 'commentsCount')
        }
      });
    }
    return data;
  }
});
