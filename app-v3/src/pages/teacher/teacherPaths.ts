/**
 * Lærer-ruter. Bygger på de eksisterende ROUTES-stiene fra v2 og legger til
 * detalj-/redigeringsstier for enkeltprøver.
 */
import { ROUTES } from '../../routes/paths';

export const TEACHER_ROUTES = {
  HOME: ROUTES.TEACHER_HOME,
  MY_TESTS: ROUTES.MY_TESTS,
  CREATE_TEST: ROUTES.CREATE_TEST,
  ANALYTICS: ROUTES.ANALYTICS,
  /** /lærer/prove/:testId */
  testDetails: (id: string) => `/lærer/prove/${id}`,
  /** /lærer/rediger/:testId */
  editTest: (id: string) => `/lærer/rediger/${id}`,
} as const;

/** Rute-mønstre for react-router (med :param). */
export const TEACHER_ROUTE_PATTERNS = {
  TEST_DETAILS: '/lærer/prove/:testId',
  EDIT_TEST: '/lærer/rediger/:testId',
} as const;
