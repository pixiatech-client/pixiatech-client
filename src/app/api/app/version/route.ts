import { NextRequest, NextResponse } from 'next/server';
import {
  APP_VERSION,
  BUILD_COMMIT,
  BUILD_TIME,
  BUILD_SIGNATURE,
} from '../../../../lib/build-info';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      version: APP_VERSION,
      commit: BUILD_COMMIT,
      buildTime: BUILD_TIME,
      signature: BUILD_SIGNATURE,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
