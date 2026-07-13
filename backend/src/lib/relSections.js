// Shared definition of the three SKOS-XL relation kinds shown on the concept
// edit page (Relações Semânticas) — single source of truth for both the
// initial page render (concepts/edit.ejs) and the add/remove relation routes
// (relations.js), which must re-render the same pill list on success.
export const REL_SECTIONS = [
  { key: 'broader', label: 'Mais amplo (BT)', colorClass: 'bg-blue-50 text-blue-700', endpoint: 'broader' },
  {
    key: 'narrower',
    label: 'Mais específico (NT)',
    colorClass: 'bg-purple-50 text-purple-700',
    endpoint: 'narrower',
  },
  { key: 'related', label: 'Relacionado (RT)', colorClass: 'bg-forest-50 text-forest-700', endpoint: 'related' },
];
