// Admin View Controller
// Handles rendering of admin EJS views

import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Render admin dashboard
 * GET /
 */
export const renderDashboard = asyncHandler(async (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    currentPage: 'dashboard',
  });
});

/**
 * Render terms list
 * GET /terms
 */
export const renderTermsList = asyncHandler(async (req, res) => {
  res.render('terms-list', {
    title: 'Gerenciar Termos',
    currentPage: 'terms',
  });
});

/**
 * Render term create/edit form
 * GET /terms/new or /terms/:id/edit
 */
export const renderTermForm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isEdit = !!id;

  res.render('term-form', {
    title: isEdit ? 'Editar Termo' : 'Novo Termo',
    currentPage: 'terms',
    termId: id || null,
    isEdit,
  });
});

/**
 * Render relationships list
 * GET /relationships
 */
export const renderRelationshipsList = asyncHandler(async (req, res) => {
  res.render('relationships-list', {
    title: 'Gerenciar Relacionamentos',
    currentPage: 'relationships',
  });
});

/**
 * Render relationship create form
 * GET /relationships/new
 */
export const renderRelationshipForm = asyncHandler(async (req, res) => {
  res.render('relationship-form', {
    title: 'Novo Relacionamento',
    currentPage: 'relationships',
  });
});

/**
 * Render collections list
 * GET /collections
 */
export const renderCollectionsList = asyncHandler(async (req, res) => {
  res.render('collections-list', {
    title: 'Gerenciar Coleções',
    currentPage: 'collections',
  });
});

/**
 * Render collection create/edit form
 * GET /collections/new or /collections/:id/edit
 */
export const renderCollectionForm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isEdit = !!id;

  res.render('collection-form', {
    title: isEdit ? 'Editar Coleção' : 'Nova Coleção',
    currentPage: 'collections',
    collectionId: id || null,
    isEdit,
  });
});

/**
 * Render audit logs
 * GET /audit
 */
export const renderAuditLogs = asyncHandler(async (req, res) => {
  res.render('audit-logs', {
    title: 'Logs de Auditoria',
    currentPage: 'audit',
  });
});

export default {
  renderDashboard,
  renderTermsList,
  renderTermForm,
  renderRelationshipsList,
  renderRelationshipForm,
  renderCollectionsList,
  renderCollectionForm,
  renderAuditLogs,
};
