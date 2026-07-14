const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
`;
code = code.replace("import { onAuthStateChanged, signInWithPopup, signInWithRedirect } from 'firebase/auth';", replacement);

const useStoreStart = code.indexOf('export default function App() {');
const useStoreEnd = code.indexOf('  useEffect(() => {', useStoreStart);

if (useStoreStart !== -1 && useStoreEnd !== -1) {
    const insert = `
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
        if (result) {
            console.log("Redirect sign-in successful", result);
        }
    }).catch((error) => {
        console.error("Redirect sign-in error:", error);
    });
  }, []);
`;
    code = code.substring(0, useStoreEnd) + insert + code.substring(useStoreEnd);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched App.tsx with getRedirectResult");
}
