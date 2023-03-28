'use strict';

const path = require('path');

const CACHE_DIR = path.join(...['node_modules', '.cache', 'strapi']);

module.exports = {
  CACHE_DIR,
};
