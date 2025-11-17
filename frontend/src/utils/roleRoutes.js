const roleMap = {
  ADMIN: '/admin',
  QA: '/admin',
  EXPORTER: '/exporter',
  CUSTOMS: '/customs',
  IMPORTER: '/customs',
};

export function getRoleLanding(role) {
  return roleMap[role] || '/exporter';
}

export function getLandingMap() {
  return roleMap;
}


