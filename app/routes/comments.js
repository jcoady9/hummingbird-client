import Route from 'ember-route';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import service from 'ember-service/inject';
import DataErrorMixin from 'client/mixins/routes/data-error';
import clip from 'clip';

export default Route.extend(DataErrorMixin, {
  i18n: service(),

  model({ id }) {
    return get(this, 'store').findRecord('comment', id, {
      include: 'user,parent,post,post.user,post.targetUser,post.media',
      reload: true
    });
  },

  afterModel(model) {
    set(this, 'breadcrumb', `Comment by ${get(model, 'user.name')}`);
    this.setHeadTags(model);
  },

  setupController(controller, model) {
    this._super(...arguments);
    const postId = get(model, 'post.id');
    const parentId = get(model, 'parent.id');
    set(controller, 'post', get(this, 'store').peekRecord('post', postId));
    set(controller, 'parent', get(this, 'store').peekRecord('comment', parentId));
  },

  titleToken(model) {
    const commenter = get(model, 'user.name');
    return get(this, 'i18n').t('titles.comments', { user: commenter });
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
    if (get(model, 'likesCount')) {
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
          content: `${get(model, 'likesCount')}`
        }
      });
    }
    if (get(model, 'repliesCount')) {
      data.push({
        type: 'meta',
        tagId: 'meta-twitter-label2',
        attrs: {
          property: 'twitter:label2',
          content: 'Replies'
        }
      }, {
        type: 'meta',
        tagId: 'meta-twitter-data2',
        attrs: {
          property: 'twitter:data2',
          content: get(model, 'repliesCount')
        }
      });
    }
    return data;
  }
});
