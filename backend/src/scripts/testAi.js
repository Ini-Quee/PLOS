const { analyzeJournalEntry } = require('../services/aiAnalysis');

async function run() {
  const result = await analyzeJournalEntry(
    'I need to finish my report by Friday and meet John tomorrow at 2pm. I am feeling stressed but focused.'
  );

  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);