/**
 * Adds dropdowns to every parsing tab in this spreadsheet (finds columns by
 * header name, so column order doesn't matter). Safe to re-run any time -- run it
 * after you paste in a new chapter tab. Adds a "Parsing" menu to the sheet.
 */
const DROPDOWNS = {
  "Type": ["Noun", "Verb", "Participle", "Infinitive", "Adjective", "Article", "Pronoun", "Preposition", "Conjunction", "Adverb", "Particle"],
  "Case": ["Nominative", "Genitive", "Dative", "Accusative", "Vocative"],
  "Person": ["1st", "2nd", "3rd"],
  "Number": ["Singular", "Plural"],
  "Gender": ["Masculine", "Feminine", "Neuter"],
  "Tense": ["Present", "Imperfect", "Future", "Aorist", "Perfect", "Pluperfect"],
  "Voice": ["Active", "Middle", "Passive", "Middle/Passive"],
  "Mood": ["Indicative", "Subjunctive", "Optative", "Imperative"],
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Parsing").addItem("Add dropdowns to all tabs", "addDropdowns").addToUi();
}

function addDropdowns() {
  SpreadsheetApp.getActive().getSheets().forEach(function (sheet) {
    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
    const rows = sheet.getMaxRows() - 1;
    if (rows < 1) return;
    Object.keys(DROPDOWNS).forEach(function (name) {
      const col = header.indexOf(name) + 1;
      if (!col) return;
      const rule = SpreadsheetApp.newDataValidation().requireValueInList(DROPDOWNS[name], true).setAllowInvalid(false).build();
      sheet.getRange(2, col, rows, 1).setDataValidation(rule);
    });
  });
}
