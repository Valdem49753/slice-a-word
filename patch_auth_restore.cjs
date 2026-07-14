const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
        <button 
          onClick={async () => {
            try {
              await signInWithPopup(auth, googleProvider);
            } catch (error: any) {
              console.error("Sign in failed:", error);
              if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.message.includes('cross-origin')) {
                // fallback
                await signInWithRedirect(auth, googleProvider);
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
    console.log("Restored auth");
}
