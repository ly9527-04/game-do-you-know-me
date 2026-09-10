import { retiredEntry } from '@/lib/legacy-entry'
export async function POST(_request: Request, _context?: unknown) { return retiredEntry() }
