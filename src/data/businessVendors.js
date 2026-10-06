// India Mela's business and craft vendor booths, from the committee's workbook.
//
// Source: "India Mela 2026 Task List.xlsx", tab "Business Vendors 2026". That
// one sheet holds two tables, and both are here:
//
//   Rows 2–22, under the headings on row 1 — the outreach list. Who asked,
//   what they sell, and how far the conversation got (Confirmed, No Response,
//   Not Participating) with payment and follow-up notes.
//
//   Rows 55–63, under "2026 Business Vendor Booths" on row 54 — a later, more
//   formal list with tax IDs and a services description, and no status column.
//
// They are kept as written rather than merged, because they are two different
// records and merging would quietly decide things the committee has not.
// Four vendors appear in both, matched by email:
//
//   Shekhar Gupta   Heartfulness Meditation SLC  /  Heartfulness Meditation
//   Monika Mittal   Eyebrow Threading…           /  …by Monika (tax ID 753657975)
//   Nagesh/Nageswara  Nakshatra Collections- Dresses / Nakshatra Collections
//   Sagar           Saaga Heating & Cooling      /  Saaga HVAC *and* Saaga
//                                                   Constructions — two booths,
//                                                   so this is not a plain
//                                                   duplicate
//
// Removing the row you do not want takes one click; guessing which one to drop
// does not.
//
// Two columns on the sheet are not carried across. Column F ("Logo?") is empty
// on every row. An unlabelled column M holds five values — "Ice Cream",
// "Medical", "Temple", "Gold Sponsor", "Title SPonsor" — that do not line up
// with the rows beside them and read as a list pasted in from somewhere else;
// they are not services and are left out rather than invented into a column.
//
// Booth Number is a new field with no counterpart on the sheet and is blank on
// all 30. The "#" column in the second table numbers its own rows, which is
// not the same as a pitch on the field.
export const melaBusinessVendors = [
  { id: 1, requestor: 'Shekhar Gupta', business: 'Heartfulness Meditation SLC', email: 'shekhargupta2k14@gmail.com', phone: '2566510623', nonProfit: true, status: 'Confirmed', payment: 'Paid', comments: 'Confirmation Sent' },
  { id: 2, requestor: 'Sahiwany Sharma', business: 'Plant Based Food Stall', email: 'shiwanii.sharmaa@gmail.com', phone: '5415985398', status: 'Confirmed', payment: 'Paid', comments: 'Confirmation Sent' },
  { id: 3, requestor: 'Monika Mittal', business: 'Eyebrow Threading, Henna Art and Face Painting', email: 'mittalmonika48@gmail.com', phone: '9496012672', status: 'Confirmed', payment: 'Paid', comments: 'Confirmation Sent' },
  { id: 4, requestor: 'Meghashree Kaishetty', business: 'Art of Living (Yoga/Meditation)', email: 'meghak@artofliving.org', phone: '7815911305 / 8587053315', nonProfit: true, status: 'Confirmed', payment: 'Paid', comments: 'Confirmation Sent' },
  { id: 5, requestor: 'Priya Govindaswamy', business: 'Garvam - Jewelery', email: 'priyasofcom@gmail.com', phone: '3852162080', status: 'Confirmed', payment: 'Paid' },
  { id: 6, requestor: 'Nagesh Rao', business: 'Nakshatra Collections- Dresses', email: 'nagesh_test@yahoo.com', phone: '5128150138', status: 'Confirmed', payment: 'Paid', comments: 'Confirmation Sent' },
  { id: 7, requestor: 'Nithya Venuganan', business: 'SSVN Traders', email: 'sales@ssvntraders.com', phone: '3853477971 / 8016500000', status: 'Confirmed', payment: 'Paid', comments: 'Confirmation Sent' },
  { id: 8, requestor: 'Sagar', business: 'Saaga Heating & Cooling', email: 'sagarkavi@gmail.com', phone: '8018242703', status: 'Confirmed', payment: 'Paid' },
  { id: 9, requestor: 'Hema', business: 'Ari\'s art and creations', email: 'hemadehriya@gmail.com', phone: '8018504839', status: 'Confirmed', payment: 'Paid', comments: 'Confirmation Sent' },
  { id: 10, requestor: 'Vijay Chinnasamy', business: 'Isha Foundation', email: 'vijonline@gmail.com', phone: '3126079090', nonProfit: true, status: 'Confirmed', payment: 'Paid', comments: 'Confirmation Sent' },
  { id: 11, requestor: 'Arshia Chauhan', business: 'Fasion Heritage Boutique', email: 'arshiachauhan2009@gmail.com', phone: '8018987033', status: 'Confirmed', payment: 'Paid', comments: 'Confirmation Sent' },
  { id: 12, requestor: 'Swetha Sangepu', business: 'MUVV Wealth Builders / Sandu Wealth Builders', email: 'swethafinpro@gmail.com', phone: '6316725991', status: 'Not Participating' },
  { id: 13, requestor: 'Priya Neema', business: 'Henna / Jewelery', email: 'priya.neema@yahoo.com', status: 'Not Participating' },
  { id: 14, requestor: 'Saritha Ignatius', business: 'TBD', email: 'saritha.ignatius@gmail.com', status: 'No Response', comments: 'Follow Up sent' },
  { id: 15, requestor: 'Sushma Siddam', business: 'Art Stall', email: 'ssiddam72@gmail.com', status: 'Not Participating', comments: 'Follow Up sent' },
  { id: 16, requestor: 'Payal Parvatham', business: 'Unknown', email: 'parvathampayal@gmail.com', status: 'No Response', comments: 'Follow Up sent' },
  { id: 17, requestor: 'Ash Mn', business: 'Unknown', email: 'ashymj@gmail.com', status: 'Not Participating', comments: 'Follow Up sent' },
  { id: 18, requestor: 'Munish Sharma', business: '', email: 'sharma.munish02@gmail.com', status: 'No Response', comments: 'Follow Up sent' },
  { id: 19, requestor: 'Delna Avari', business: 'Henna & Jewelery', email: 'avaridelna@gmail.com', status: 'No Response', comments: 'Follow Up sent' },
  { id: 20, requestor: 'Sindhu Yuktha', business: 'Yuktha Arts', email: 'sindhuyuktha28@gmail.com', status: 'Not Participating', comments: 'Follow Up sent' },
  { id: 21, requestor: 'Channi Bhatti', business: 'Jewels', email: 'channibhatti@icloud.com', status: 'Not Participating', comments: 'Follow Up sent' },
  { id: 22, requestor: 'Sagar', business: 'Saaga HVAC', email: 'sagarkavi@gmail.com', phone: '8018242703' },
  { id: 23, requestor: 'Sagar', business: 'Saaga Constructions', email: 'sagarkavi@gmail.com', phone: '8018242703' },
  { id: 24, requestor: 'Anjali Kulkarni', business: 'Jewel For Joy', email: 'anjali.dr@gmail.com', phone: '8012592131', services: 'Daily office-wear jewelry' },
  { id: 25, requestor: 'Priya Ramalingam', business: 'Garvam LLC', email: 'garvamllc@gmail.com', phone: '3852162080' },
  { id: 26, requestor: 'Kanta Chauhan', business: '', email: 'rghuman040@gmail.com', phone: '8018980730' },
  { id: 27, requestor: 'Monika Rani', business: 'Eyebrow Threading, Henna Art and Face Painting by Monika', email: 'MITTALMONIKA48@GMAIL.COM', phone: '9496012672', taxId: '753657975', services: 'Sarees Boutique' },
  { id: 28, requestor: 'Nageswara Gummarao', business: 'Nakshatra Collections', email: 'nagesh_test@yahoo.com', phone: '5128150138', taxId: '844198141', services: 'Indian Dresses' },
  { id: 29, requestor: 'Suraj', business: 'Maisa Wealth', email: 'suraj@maisawealth.com', phone: '3852024567' },
  { id: 30, requestor: 'Shekhar Gupta', business: 'Heartfulness Meditation', email: 'shekhargupta2k14@gmail.com', phone: '2566510623', nonProfit: true, taxId: '811750608', services: 'No Sales' },]
