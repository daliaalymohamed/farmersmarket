// app/api/revalidate/route.js
import { revalidatePath } from 'next/cache';

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get('secret');
  const path = request.nextUrl.searchParams.get('path') || '/';

  console.log('🔍 Revalidate requested:', { path, hasSecret: !!secret });

  if (secret !== process.env.REVALIDATE_SECRET) {
    console.warn('❌ Invalid secret:', secret);
    return Response.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }

  try {
    revalidatePath(path);
    console.log(`✅ Successfully revalidated: ${path}`);
    return Response.json({ revalidated: true, path });
  } catch (err) {
    console.error(`❌ Failed to revalidate ${path}:`, err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}