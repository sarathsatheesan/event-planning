// India Mela's sponsor pipeline, from the committee's workbook.
//
// Source: "India Mela 2026 Task List.xlsx", tab "2026 Sponsors" — 77 names,
// the list the committee works through each year.
//
// The sheet's columns had drifted from its own headers, so this is not a
// straight copy. What was corrected, and why:
//
//   "Contacted" held the name of whoever made the approach (Ashwin, Satish,
//   Venkat, Sreekanta), not a yes/no. It becomes Temple POC here — the app
//   has one person column for a sponsor, not two meaning the same thing.
//
//   "Temple POC" held the outcome: "Declined", "No Response", and for Sagar
//   "Declined, but will open a Vendor stall for HVAC". Those move to the new
//   Response column; Sagar's trailing clause becomes a comment.
//
//   The four agreed sponsors at the bottom (rows 77–80 of the sheet) were
//   shifted a column left: their tier sat under "Contacted", their amount
//   under "Temple POC", and their payment note under "Sponsorship Agreed".
//   They are put back where they belong, and the notes become structured —
//   "Check received on 3rd Oct" is mode Check, 3 Oct 2026; "ICC Wix" is the
//   payment mode. Nothing else was inferred from them.
//
// Category is blank on every row. The sheet has no such column and guessing a
// category from a business name is not the same as knowing it; the committee
// fills it in from the dropdown.
//
// $8,250 agreed across the four confirmed sponsors, all received.
export const melaSponsors = [
  { id: 1, name: 'Shilpi - First Utah, Asian Commerce' },
  { id: 2, name: 'Corner Grocery' },
  { id: 3, name: 'Maulik Shah' },
  { id: 4, name: 'Munchcart' },
  { id: 5, name: 'Prakash Shah' },
  { id: 6, name: 'Dinesh Patel' },
  { id: 7, name: 'Salt Lake Arts' },
  { id: 8, name: 'JB Propoerties' },
  { id: 9, name: 'Jaya Agadurappa', templePoc: 'Ashwin' },
  { id: 10, name: 'Wasatch Deli Provisions' },
  { id: 11, name: 'SV Cafe' },
  { id: 12, name: 'Flavors of India' },
  { id: 13, name: 'Shweta\'s Cake Studio' },
  { id: 14, name: 'SNN Management' },
  { id: 15, name: 'Kumon', templePoc: 'Ashwin' },
  { id: 16, name: 'Cottonwood Health' },
  { id: 17, name: 'Namaste Nanglo' },
  { id: 18, name: 'Ganesh' },
  { id: 19, name: 'Bombay House' },
  { id: 20, name: 'ApnaBazaar' },
  { id: 21, name: 'Desi Groceries' },
  { id: 22, name: 'Zions' },
  { id: 23, name: 'Adobe' },
  { id: 24, name: 'Phani' },
  { id: 25, name: 'Tandoor' },
  { id: 26, name: 'Saffron Valley/Circle' },
  { id: 27, name: 'Royal India' },
  { id: 28, name: 'Bhansa Ghar' },
  { id: 29, name: 'Himalayan Kitchen (Surya)' },
  { id: 30, name: 'Masala Square' },
  { id: 31, name: 'Shop N Go /Cash N Carry' },
  { id: 32, name: 'Pineapple properties' },
  { id: 33, name: 'Symantec' },
  { id: 34, name: 'Amex' },
  { id: 35, name: 'Microsoft' },
  { id: 36, name: 'Waterford', templePoc: 'Satish' },
  { id: 37, name: 'Challenger', templePoc: 'Satish' },
  { id: 38, name: 'Goldmansachs' },
  { id: 39, name: 'Fatpipe' },
  { id: 40, name: 'Nitya Software solutions', templePoc: 'Venkat', response: 'No response' },
  { id: 41, name: 'Jayaraman (E2 Tech' },
  { id: 42, name: 'UDK' },
  { id: 43, name: 'Medallus Medical' },
  { id: 44, name: 'NJRA' },
  { id: 45, name: 'Laxmi Conelly', templePoc: 'Satish' },
  { id: 46, name: 'Ivory' },
  { id: 47, name: 'Pharma Company' },
  { id: 48, name: 'Medical professionals' },
  { id: 49, name: 'Lennar Homes' },
  { id: 50, name: 'Edge Homes' },
  { id: 51, name: 'DR Horton homes' },
  { id: 52, name: 'Richmond Homes' },
  { id: 53, name: 'Biz Cafe RISE Culiniary Institue - Lavanya' },
  { id: 54, name: 'Sonia Pal' },
  { id: 55, name: 'Kathmandu' },
  { id: 56, name: 'Immigration attorney (Olson immigration law)' },
  { id: 57, name: 'Nimesh Chaudary (Laquinta)' },
  { id: 58, name: 'Sagar', templePoc: 'Ashwin', response: 'Declined', comments: 'Will open a Vendor stall for HVAC' },
  { id: 59, name: 'Rajavi', templePoc: 'Ashwin', response: 'Declined' },
  { id: 60, name: 'Madhu' },
  { id: 61, name: 'Gautham', templePoc: 'Ashwin' },
  { id: 62, name: 'Indira' },
  { id: 63, name: 'Curry Connect' },
  { id: 64, name: 'Kaver Groceries' },
  { id: 65, name: 'Annapurni' },
  { id: 66, name: 'Delta', templePoc: 'Ashwin', response: 'No response' },
  { id: 67, name: 'Other Airlines' },
  { id: 68, name: 'T Mobile', templePoc: 'Ashwin', response: 'Declined' },
  { id: 69, name: 'Goldfish', templePoc: 'Sreekanta' },
  { id: 70, name: 'Lego store', templePoc: 'Ashwin' },
  { id: 71, name: 'Kindergarten next to Biscoff' },
  { id: 72, name: 'Danecstudio opposite to GoldFish' },
  { id: 73, name: 'Sunnyhill Financials', response: 'Agreed', tier: 'Title', amount: 3000, paymentReceived: true, mode: 'Check', datePaid: '2026-10-03' },
  { id: 74, name: 'Investment Path Finders (Milind Zodge)', response: 'Agreed', tier: 'Platinum', amount: 2000, paymentReceived: true, mode: 'ICC Wix' },
  { id: 75, name: 'Maisa Wealth (Suraj)', response: 'Agreed', tier: 'Gold', amount: 1250, paymentReceived: true, mode: 'ICC Wix' },
  { id: 76, name: 'NJRA', response: 'Agreed', tier: 'Platinum', amount: 2000, paymentReceived: true, mode: 'Check', datePaid: '2026-09-18' },
  { id: 77, name: 'Family Pediatric' },]
