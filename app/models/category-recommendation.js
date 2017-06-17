import Base from 'client/models/-base';
import { belongsTo, hasMany } from 'ember-data/relationships';

export default Base.extend({
  category: belongsTo('category'),
  media: hasMany('media')
});
