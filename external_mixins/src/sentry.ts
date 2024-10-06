import { browser } from '$app/environment';
import * as Sentry from '@sentry/browser';

const sentryEnabled = () => browser && !window.location.href.includes('localhost');

export const maybeInitSentry = () => {
	if (sentryEnabled()) {
		Sentry.init({
			dsn: 'https://4729ba552b1f80ba04e9fd45ee72ea39@sentry.ameo.design/9',
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
