import { browser } from '$app/environment';
import * as Sentry from '@sentry/browser';

const sentryEnabled = () => browser && !window.location.href.includes('localhost');

export const maybeInitSentry = () => {
  if (sentryEnabled()) {
    Sentry.init({
      dsn: 'https://5e1cf93ec7ab409196ef81f87cd36b42@sentry.ameo.design/15',
    });
  }
};

export const getSentry = () => {
  if (!sentryEnabled()) {
    return null;
  }

  return Sentry;
};

export const captureMessage = (eventName: string, data?: any) =>
  getSentry()?.captureMessage(eventName, data ? { extra: data } : undefined);
