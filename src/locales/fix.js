import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target file to update
const translationsFilePath = path.join(__dirname, 'translations.js');

// All 22 scheduled languages of India + English
const loadingDataTranslations = {
  en: "Loading data...",
  hi: "डेटा लोड हो रहा है...",
  as: "ডেটা ল'ড হৈ আছে...",
  bn: "ডেটা লোড হচ্ছে...",
  brx: "डाटा लद जाबाय दं...",
  doi: "डेटा लोड होआ करदा ऐ...",
  gu: "ડેટા લોડ થઈ રહ્યો છે...",
  kn: "ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
  ks: "ڈیٹا چھُ لوڈ گژھان...",
  kok: "डेटा लोड जाता...",
  mai: "डेटा लोड भ रहल अछि...",
  ml: "ഡാറ്റ ലോഡ് ചെയ്യുന്നു...",
  mni: "ডেতা লোড তৌরি...",
  mr: "डेटा लोड होत आहे...",
  ne: "डाटा लोड हुँदैछ...",
  or: "ଡାଟା ଲୋଡ୍ ହେଉଛି...",
  pa: "ਡਾਟਾ ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
  sa: "दत्तांशः भार्यते...",
  sat: "ᱰᱟᱴᱟ ᱞᱚᱰᱚᱜ ᱠᱟᱱᱟ...",
  sd: "ڊيٽا لوڊ ٿي رهي آهي...",
  ta: "தரவு ஏற்றப்படுகிறது...",
  te: "డేటా లోడ్ అవుతోంది...",
  ur: "ڈیٹا لوڈ ہو رہا ہے..."
};

async function fixTranslations() {
  try {
    console.log(`🔍 Looking for translations file at: ${translationsFilePath}`);

    if (!fs.existsSync(translationsFilePath)) {
      console.error(`❌ Error: Could not find translations.js in the current directory.`);
      return;
    }

    // Read the current file content
    let content = fs.readFileSync(translationsFilePath, 'utf8');

    // SAFEGUARD: Remove any existing 'loadingData' keys to prevent duplicates 
    // in case you run this script more than once.
    content = content.replace(/\s*loadingData\s*:\s*["'].*?["'],?/g, '');

    let updatedCount = 0;

    // Loop through our 23 languages and inject them into the file
    for (const [lang, text] of Object.entries(loadingDataTranslations)) {
      // Regex detects the language key block. 
      // It matches: en: { OR "en": { OR 'en': {
      const regex = new RegExp(`(['"]?${lang}['"]?\\s*:\\s*\\{)`, 'g');
      
      if (regex.test(content)) {
        // Inject the translation exactly on the next line inside the object
        content = content.replace(regex, `$1\n    loadingData: "${text}",`);
        updatedCount++;
        console.log(`✅ Injected loadingData for: ${lang}`);
      } else {
        console.log(`⚠️ Language block for '${lang}' not found in translations.js. Skipping.`);
      }
    }

    // Write the updated content back to the file system
    fs.writeFileSync(translationsFilePath, content, 'utf8');
    
    console.log(`\n🎉 Success! Automatically updated ${updatedCount} languages in translations.js.`);

  } catch (err) {
    console.error("❌ An error occurred during the update process:", err);
  }
}

// Execute the fix
fixTranslations();