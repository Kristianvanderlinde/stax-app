import { backupFileName, exportBackup } from '$lib/server/backup';

/** Download de back-up als bestand. */
export function GET() {
	return new Response(JSON.stringify(exportBackup()), {
		headers: { 'content-type': 'application/json', 'content-disposition': `attachment; filename="${backupFileName()}"`, 'cache-control': 'no-store' }
	});
}
