/* eslint-disable no-console */
import {
  getCloverConfig,
  getMerchantInfo,
  CloverApiError,
} from '@/lib/clover';

async function main() {
  const config = getCloverConfig();
  console.log('Clover config:');
  console.log('  environment:    ', config.environment);
  console.log('  baseUrl:        ', config.baseUrl);
  console.log('  appId set:      ', !!config.appId);
  console.log('  merchantId set: ', !!config.merchantId);
  console.log('  accessToken set:', !!config.accessToken);

  if (!config.merchantId || !config.accessToken) {
    console.log('\nSetup incomplete. Complete the OAuth flow first:');
    console.log(
      '  1. Set CLOVER_APP_ID and CLOVER_APP_SECRET from your Clover dev dashboard',
    );
    console.log(
      '  2. Visit the app marketplace install link to grant access',
    );
    console.log('  3. Capture the access token from the OAuth callback');
    console.log(
      '  4. Set CLOVER_MERCHANT_ID and CLOVER_ACCESS_TOKEN in .env.local',
    );
    process.exit(0);
  }

  try {
    const merchant = (await getMerchantInfo()) as { name?: string };
    console.log(
      `\nSandbox merchant info retrieved: ${merchant.name || '(no name)'}`,
    );
    console.log('Connection OK.');
  } catch (err) {
    if (err instanceof CloverApiError) {
      console.error(`\nClover API error ${err.status}:`, err.message);
      console.error('Body:', err.body);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
