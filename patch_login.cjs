const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /import \{ onAuthStateChanged, signInWithPopup \} from 'firebase\/auth';/,
  "import { onAuthStateChanged, signInWithPopup, signInWithRedirect } from 'firebase/auth';"
);

code = code.replace(
  /onClick=\{\(\) => signInWithPopup\(auth, googleProvider\)\}/,
  `onClick={async () => {
            try {
              await signInWithPopup(auth, googleProvider);
            } catch (error: any) {
              console.error("Sign in failed:", error);
              if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.message.includes('cross-origin')) {
                signInWithRedirect(auth, googleProvider);
              } else {
                alert("Sign in failed. If you are on a mobile device or using Safari, please open the app in a new tab or try again. Error: " + error.message);
              }
            }
          }}`
);

fs.writeFileSync('src/App.tsx', code);
