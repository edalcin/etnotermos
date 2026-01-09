// Public View Controller
// Handles rendering of public EJS views

import { asyncHandler } from '../middleware/errorHandler.js';
import { getDashboardStatistics } from '../../services/DashboardService.js';

/**
 * Render home page
 * GET /
 */
export const renderHomePage = asyncHandler(async (req, res) => {
  const stats = await getDashboardStatistics();

  res.render('index', {
    title: 'Início',
    description: 'Vocabulário controlado para etnobotânica',
    stats,
  });
});

/**
 * Render browse page
 * GET /browse
 */
export const renderBrowsePage = asyncHandler(async (req, res) => {
  res.render('browse', {
    title: 'Navegar Termos',
    description: 'Explore o vocabulário controlado',
  });
});

/**
 * Render search page
 * GET /search
 */
export const renderSearchPage = asyncHandler(async (req, res) => {
  const query = req.query.q || '';

  res.render('search', {
    title: 'Buscar Termos',
    description: 'Busca avançada no vocabulário',
    query,
  });
});

/**
 * Render term detail page
 * GET /terms/:id
 */
export const renderTermDetailPage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  res.render('term-detail', {
    title: 'Detalhes do Termo',
    termId: id,
    includeGraph: true, // Include Cytoscape.js
  });
});

/**
 * Render about page
 * GET /about
 */
export const renderAboutPage = asyncHandler(async (req, res) => {
  res.render('about', {
    title: 'Sobre',
    description: 'Sobre o EtnoTermos',
  });
});

/**
 * Render export page
 * GET /export
 */
export const renderExportPage = asyncHandler(async (req, res) => {
  res.render('export', {
    title: 'Exportar Dados',
    description: 'Exportar vocabulário em diversos formatos',
  });
});

export default {
  renderHomePage,
  renderBrowsePage,
  renderSearchPage,
  renderTermDetailPage,
  renderAboutPage,
  renderExportPage,
};
