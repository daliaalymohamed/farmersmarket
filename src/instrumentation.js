// instrumentation.js (root of your project, same level as app/)
export async function register() {
    // This runs ONCE when the server starts
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('🚀 Server starting - search will sync in background');
        
        try {
            const { syncData } = await import('@/lib/utils/syncToMeili');
            await syncData(true); // force sync + wait for task completion
            console.log('✅ Search index synced and ready');
        } catch (err) {
            console.error('❌ Failed to sync search index:', err.message);
        }
    }
}