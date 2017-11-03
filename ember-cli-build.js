/* eslint-env node */
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const PostCSSFlex = require('postcss-flexbugs-fixes');
const Autoprefixer = require('autoprefixer');
const svgoUniqueIds = require('svgo-plugin-unify-ids');
const targets = require('./config/targets');

module.exports = function(defaults) {
  const app = new EmberApp(defaults, {
    browseryStats: EmberApp.env() === 'development',

    babel: {
      comments: false,
      plugins: ['transform-object-rest-spread']
    },

    'ember-cli-babel': {
      includePolyfill: true
    },

    'ember-cli-password-strength': {
      bundleZxcvbn: false
    },

    sourcemaps: {
      enabled: true,
      extensions: ['js']
    },

    outputPaths: {
      app: {
        css: {
          'light-theme': '/assets/light.css',
          'dark-theme': '/assets/dark.css'
        }
      }
    },

    sassOptions: {
      includePaths: ['node_modules/bootstrap/scss']
    },

    postcssOptions: {
      compile: { enabled: false },
      filter: {
        enabled: true,
        plugins: [
          { module: PostCSSFlex },
          { module: Autoprefixer,
            options: { browsers: targets.browsers }
          }
        ]
      }
    },

    fingerprint: {
      exclude: [
        'OneSignalSDKWorker.js',
        'OneSignalSDKUpdaterWorker.js',

        'apple-app-site-association',

        // can be removed when ember-web-app supports mstile
        'mstile-70x70.png',
        'mstile-150x150.png',
        'mstile-310x150.png',
        'mstile-310x310.png'
      ]
    },

    svgJar: {
      persist: false,
      optimizer: {
        plugins: [
          { removeTitle: true },
          { removeDesc: true },
          { removeXMLNS: true },
          { uniqueIds: svgoUniqueIds }
        ]
      }
    },

    // assets
    nodeAssets: {
      autosize: {
        srcDir: 'dist',
        import: ['autosize.js']
      },
      clipboard: {
        srcDir: 'dist',
        import: ['clipboard.js']
      },
      cropperjs: {
        srcDir: 'dist',
        import: ['cropper.css', 'cropper.js']
      },
      flickity: {
        srcDir: 'dist',
        import: ['flickity.css']
      },
      getstream: {
        srcDir: 'dist/js',
        import: ['getstream.js']
      },
      hoverintent: {
        srcDir: 'dist',
        import: ['hoverintent.min.js']
      }
    }
  });

  // Work around for Ember 2.16.2 and Sourcemaps in production
  app.import('node_modules/showdown/dist/showdown.js.map', { destDir: 'assets' });

  return app.toTree();
};
