import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { getDatabase } from '@netlify/database';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/netlify-db';
import { notebooks } from '../../db/schema.ts';
import { validState } from '../../public/journal.js';

export const config = { path: '/api/*' };
const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { 'Cache-Control':'private, no-store', ...headers } });
const hash = value => createHash('sha256').update(value).digest('hex');
const maxBody = 8 * 1024 * 1024;
let database;

async function readLimited(request, limit) {
  if (Number(request.headers.get('content-length')) > limit) throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError();
  const parts = []; let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) { await reader.cancel(); throw new RangeError(); }
    parts.push(value);
  }
  return Buffer.concat(parts, length);
}

export default async function handle(request) {
  const url = new URL(request.url);
  const read = request.method === 'GET';
  if (!read && request.headers.get('origin') !== url.origin) return json({error:'Open this journal directly to make changes.'}, 403);
  const cookie = request.headers.get('cookie')?.match(/(?:^|;\s*)pawtrack_book=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!cookie && !(read && url.pathname === '/api/journal')) return json({error:'Reopen the journal to start a session.'}, 401);
  const session = cookie || randomBytes(32).toString('hex');
  const owner = hash(session);
  const cookieHeader = { 'Set-Cookie':`pawtrack_book=${session}; Path=/; HttpOnly; Max-Age=31536000; ${url.protocol === 'https:' ? 'SameSite=None; Secure; Partitioned' : 'SameSite=Lax'}` };
  try {
    if (url.pathname === '/api/journal') {
      const db = database ??= drizzle({client:getDatabase()});
      if (read) {
        const [row] = await db.select().from(notebooks).where(eq(notebooks.owner, owner)).limit(1);
        if (!row) return json({revision:0,state:null},200,cookieHeader);
        const {pets,logs,reminders,selectedPetId,revision} = row;
        return json({revision,state:{pets,logs,reminders,selectedPetId}},200,cookieHeader);
      }
      if (request.method !== 'PUT') return json({error:'Unsupported method.'},405);
      const {state, revision} = JSON.parse((await readLimited(request,maxBody)).toString());
      if (!Number.isSafeInteger(revision) || revision < 0 || !validState(state)) return json({error:'The journal contains invalid or oversized records.'},400);
      const {pets, logs, reminders, selectedPetId} = state;
      const fields = {pets,logs,reminders,selectedPetId,revision:revision+1,updatedAt:new Date()};
      const rows = revision === 0 ? await db.insert(notebooks).values({owner,...fields}).onConflictDoNothing().returning({revision:notebooks.revision}) : await db.update(notebooks).set(fields).where(and(eq(notebooks.owner,owner),eq(notebooks.revision,revision))).returning({revision:notebooks.revision});
      return rows.length ? json(rows[0]) : json({error:'Your journal changed in another tab. Reopen the entry and try again.'},409);
    }
    if (url.pathname === '/api/photos' && request.method === 'POST') {
      if (!request.headers.get('content-type')?.startsWith('image/jpeg')) return json({error:'Choose a JPEG image.'},415);
      const file = await readLimited(request, 512*1024);
      if (file[0] !== 0xff || file[1] !== 0xd8 || file[2] !== 0xff) return json({error:'Invalid photo.'},400);
      const photoId = randomUUID();
      await getStore('pet-portraits').set(`${owner}/${photoId}`, new Uint8Array(file).buffer);
      return json({photo:`/api/photos/${photoId}`},201);
    }
    if (read && /^\/api\/photos\/[\da-f-]{36}$/.test(url.pathname)) {
      const photo = await getStore({name:'pet-portraits',consistency:'strong'}).get(`${owner}/${url.pathname.split('/').pop()}`,{type:'arrayBuffer'});
      return photo ? new Response(photo,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}}) : json({error:'Photo not found.'},404);
    }
    return json({error:'Not found.'},404);
  } catch (error) {
    if (error instanceof SyntaxError) return json({error:'Invalid journal format.'},400);
    if (error instanceof RangeError) return json({error:'This file is too large.'},413);
    return json({error:'Your journal connection is unavailable. Please try again.'},503);
  }
}
