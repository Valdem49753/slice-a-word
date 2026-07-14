To solve the "almost there grant permission for the required security cookie" issue in Safari with Firebase Auth:
Firebase Auth relies on cross-origin iframe communication for popup and redirect. When third-party cookies are blocked, Firebase Auth falls back to asking the user to grant storage access.
To avoid this, the app must be served from the same domain as the `authDomain`, or use a custom domain.
