import { getPeople } from '#lib/server/people.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => ({ people: getPeople() });
