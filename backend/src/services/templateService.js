const path = require('path');
const { v4: uuid } = require('uuid');
const { ensureJSON, readJSON, writeJSON } = require('../lib/fileStore');
const auditService = require('./auditService');

const TEMPLATE_FILE = path.join(__dirname, '..', 'data', 'templates.json');

const DEFAULT_TEMPLATE = {
  id: 'dpp-v1',
  name: 'Digital Product Passport',
  description: 'Standard MOSIP-aligned passport for agricultural commodities',
  schemaUrl: 'https://mosip.io/dpp/schema/v1',
  fields: ['product.name', 'product.quantity', 'inspection.moisturePercent'],
  createdAt: new Date().toISOString(),
};

async function ensureSeeded() {
  await ensureJSON(TEMPLATE_FILE, [DEFAULT_TEMPLATE]);
  const templates = await readJSON(TEMPLATE_FILE, [DEFAULT_TEMPLATE]);
  if (!templates.length) {
    await writeJSON(TEMPLATE_FILE, [DEFAULT_TEMPLATE]);
    return [DEFAULT_TEMPLATE];
  }
  return templates;
}

async function listTemplates() {
  const templates = await ensureSeeded();
  return templates;
}

async function createTemplate(user, payload) {
  const templates = await ensureSeeded();
  const now = new Date().toISOString();
  const template = {
    id: uuid(),
    name: payload.name,
    description: payload.description,
    schemaUrl: payload.schemaUrl,
    fields: payload.fields,
    createdBy: user.id,
    createdAt: now,
  };
  templates.push(template);
  await writeJSON(TEMPLATE_FILE, templates);
  await auditService.logAction('template.created', {
    userId: user.id,
    role: user.role,
    entityType: 'TEMPLATE',
    entityId: template.id,
    metadata: { name: template.name },
  });
  return template;
}

module.exports = {
  listTemplates,
  createTemplate,
};




