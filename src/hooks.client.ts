import * as Sentry from '@sentry/browser';
import type { HandleClientError } from '@sveltejs/kit';

if (window.location.hostname !== 'localhost') {
  Sentry.init({ dsn: 'https://29e81eafef8bd517b50dbe3209fd3f59@sentry.ameo.design/8' });
}

export const handleError: HandleClientError = ({ error }) => {
  Sentry.captureException(error);
};
