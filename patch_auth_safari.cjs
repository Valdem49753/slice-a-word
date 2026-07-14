const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
        <button 
          onClick={async () => {
            try {
              const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
              const isInIframe = window !== window.parent;
              
              if ((isSafari || isMobile) && !isInIframe) {
                  // Safari blocks third-party cookies required for popups, 
                  // so we use redirect for Safari and mobile outside the AI Studio editor.
                  await signInWithRedirect(auth, googleProvider);
              } else {
                  await signInWithPopup(auth, googleProvider);
              }
            } catch (error: any) {
              console.error("Sign in failed:", error);
              if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.message.includes('cross-origin')) {
                signInWithRedirect(auth, googleProvider);
              } else {
                alert("Sign in failed. Error: " + error.message);
              }
            }
          }}
`;

const startIdx = code.indexOf('<button \n          onClick={async () => {');
const endIdx = code.indexOf('          className="bg-white text-emerald-900', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched App.tsx for Safari support");
} else {
    console.log("Could not find button code");
}
