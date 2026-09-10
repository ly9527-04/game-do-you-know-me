import { retiredEntry } from '@/lib/legacy-entry'
export async function GET(_request: Request, _context?: unknown) { return retiredEntry() }
