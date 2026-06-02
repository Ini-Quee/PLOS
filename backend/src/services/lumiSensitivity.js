// Destination sensitivity tiers. Higher number = more public exposure.
const TIER = { private: 0, personal: 1, publishable: 2 };
const DESTINATION_TIER = {
  journal_page_entry: TIER.private,
  journal_draft:      TIER.private,
  lumi_daily_entry:   TIER.private,
  life_note:          TIER.private,
  budget_entry:       TIER.personal,
  habit_log:          TIER.personal,
  schedule_item:      TIER.personal,
  content_post:       TIER.publishable,   // social calendar
  scheduled_posts:    TIER.publishable,
  send_email:         TIER.publishable,   // leaves the system
};
function requiresConfirmEscalation(sourceTier, destType) {
  const d = DESTINATION_TIER[destType];
  return d !== undefined && d > sourceTier;
}
module.exports = { TIER, DESTINATION_TIER, requiresConfirmEscalation };
