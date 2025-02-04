import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const mbMetadataHeader = (await headers()).get('mb-metadata');
  const mbMetadata: { accountId: string; evmAddress: string } | undefined =
    mbMetadataHeader && JSON.parse(mbMetadataHeader);

  const { accountId, evmAddress } = mbMetadata || {};
  if (!accountId) {
    return NextResponse.json(
      {
        error: 'Unable to find user data in the request',
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({ accountId, evmAddress });
}
