/**
 * Rute-stier — portet 1:1 fra v2 (src/core/navigation/router.js) slik at
 * delte prøvelenker og QR-koder fortsetter å virke uendret.
 */
export const ROUTES = {
  // Hovedsider
  LANDING: '/',
  LOGIN: '/login',
  ROLE_SELECT: '/velg-rolle',
  HJEM: '/hjem',

  // Fag
  GLOSEMESTER: '/gloser',
  GLOSEMESTER_START: '/gloser/start',

  // Elev
  STUDENT_HOME: '/elev',
  PRACTICE: '/ov',
  QUIZ: '/prove',
  GALLERY: '/galleri',
  MY_CARDS: '/mine-kort',
  TRADE: '/bytte',
  STUDENT_PROVER: '/mine-prover',

  // Lærer
  TEACHER_HOME: '/lærer',
  CREATE_TEST: '/lærer/lag-prove',
  MY_TESTS: '/lærer/mine-prover',
  ANALYTICS: '/lærer/statistikk',
  STANDARD_TESTS: '/lærer/standardprover',
  GLOSEBANK: '/lærer/glosebank',

  // Admin
  ADMIN: '/admin',

  // Felles
  PROFILE: '/min-side',
  SETTINGS: '/innstillinger',

  // Marketing
  OPPGRADER: '/oppgrader',
  OPPGRADER_TAKK: '/oppgrader/takk',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/** Ruter som krever innlogging (jf. v2 isProtectedRoute). */
export const PROTECTED_ROUTES: RoutePath[] = [
  ROUTES.STUDENT_HOME,
  ROUTES.PRACTICE,
  ROUTES.QUIZ,
  ROUTES.GALLERY,
  ROUTES.PROFILE,
  ROUTES.TRADE,
  ROUTES.STUDENT_PROVER,
];

export function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.includes(path as RoutePath);
}
