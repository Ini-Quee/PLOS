const { analyzeJournalEntry } = require('../services/aiAnalysis');

async function run() {
  const result = await analyzeJournalEntry(
    "I need to finish my report by Friday and meet John tomorrow at 2pm. I'm feeling stressed."
  );

  console.log(result);
}

run();