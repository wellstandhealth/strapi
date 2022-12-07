'use strict';

const executeCERegister = require('../../server/register');
const createAuditLogsService = require('./services/audit-logs');

module.exports = async ({ strapi }) => {
  // strapi.auditLogs = createAuditLogsService(strapi);
  strapi.container.register('audit-logs', createAuditLogsService(strapi));
  console.log(strapi.container.get('audit-logs'));

  await executeCERegister({ strapi });
};
