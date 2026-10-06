// India Mela's food stalls, consolidated from the committee's workbook.
//
// Source: "India Mela 2026 Task List.xlsx", tabs "Food Vendors 2026" (who is
// coming, and how far through the paperwork they are) and "Food Menu2026"
// (what each stall sells, and for how much). They were separate sheets that
// named the same stalls differently — the vendor tab by organisation ("UTS"),
// the menu tab by trading name ("UTS - Chennai Express") — so both names are
// kept rather than one being thrown away.
//
// Three rows at the bottom of the vendor tab had their columns shifted one to
// the left, putting an email address in the Contact column. They are carried
// across with the email moved back where it belongs; two of them read like
// business vendors rather than food stalls, which is for the committee to
// confirm. Mobile numbers were not in either tab — the column exists and is
// empty, except where the prep sheet had one.
//
// Special requests are not a column on either tab either. The only one the
// workbook records is on the "2026 Food Stall ICC Prep Work" sheet, where
// four people wrote in asking to run a stall; one of them, The Melting Mango,
// became a stall and keeps their note. The rest of the field is empty and
// waiting for the committee — better than inventing content for it.
//
// Aroma was typed "BAPS" on the vendor tab. BAPS is no longer one of the
// offered types, so the value is cleared rather than left pointing at an
// option that does not exist; the committee picks the right one.
export const melaFoodVendors = [
  {
    id: 1, stall: 'Temple', tradingName: 'Temple Stall',
    contact: 'Pavitra', mobile: '', email: '',
    type: '', confirmed: 'Confirmed', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: true, posMeeting: false, menuProvided: true, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [
      { id: 1, item: 'Gobi Manchurian[5]', price: 7.0 },
      { id: 2, item: 'Rava Idly+Chutney', price: 5.0 },
      { id: 3, item: 'Pulihora', price: 5.0 },
      { id: 4, item: 'Live Jilebi[3]', price: 5.0 },
      { id: 5, item: 'Badusha[3]', price: 5.0 },
      { id: 6, item: 'Laddu[3]', price: 5.0 },
      { id: 7, item: 'Mango Lassi', price: 3.0 },
      { id: 8, item: 'Cold Badam Milk', price: 3.0 },
      { id: 9, item: 'Paanakam', price: 2.0 },
      { id: 10, item: 'Coffee', price: 3.0 },
      { id: 11, item: 'Butter Murukku', price: 3.5 },
      { id: 12, item: 'Boondhi', price: 3.5 },
      { id: 13, item: 'Combo 1-  Pulihora  + 2 Gobi Manchurian+1 Jilebi+Mango Lassi', price: 10.0 },
      { id: 14, item: 'Combo2 - 3 Gobi Manchurian+2 Rava Idli + Mango Lassi', price: 10.0 },
    ],
  },
  {
    id: 2, stall: 'GCAU', tradingName: '',
    contact: 'Mayaben', mobile: '', email: '',
    type: 'Reg Org', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: true, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 3, stall: 'UKK', tradingName: 'UKK Chaat Center',
    contact: 'Madhu', mobile: '', email: 'Utahkannadakuta@gmail.com',
    type: 'Reg Org', confirmed: 'Confirmed', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: true, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [
      { id: 50, item: 'Butter Set Dosa', price: 6.99 },
      { id: 51, item: 'Masalapuri', price: 5.99 },
      { id: 52, item: 'Maddur Vada with masala chunamuri', price: 2.99 },
      { id: 53, item: 'Kesar / Mango Kulfi', price: 3.99 },
      { id: 54, item: 'Classic Royal Falooda', price: 5.99 },
      { id: 55, item: 'Coconut Holige', price: 3.99 },
      { id: 56, item: 'Masala Lime Soda', price: 1.99 },
      { id: 57, item: 'Masala Majjige', price: 1.99 },
      { id: 58, item: 'Combo 1 - Masalapuri+ Coconut Holige+ majjige', price: 9.99 },
      { id: 59, item: 'Combo 2- Butter Set Dosa+ Coconut Holige+ Majjige', price: 10.99 },
    ],
  },
  {
    id: 4, stall: 'UTA', tradingName: '',
    contact: 'Ravi Yarlagadda', mobile: '', email: 'utahteluguassociation@gmail.com',
    type: 'Reg Org', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: true, posMeeting: false, menuProvided: true, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 5, stall: 'Utah Indians', tradingName: '',
    contact: 'Nageswar Rao.G', mobile: '', email: 'nagesh_test@yahoo.com',
    type: 'Friends', confirmed: 'Confirmed', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: true, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [
      { id: 36, item: 'Potato Samosa', price: 4.99 },
      { id: 37, item: 'Onion Samosa', price: 5.99 },
      { id: 38, item: 'Nanari Sharbhat', price: 5.99 },
      { id: 39, item: 'Jeelibi', price: 4.99 },
      { id: 40, item: 'Punuguloo', price: 5.99 },
      { id: 41, item: 'Masala Cut Mirchi', price: 8.99 },
      { id: 42, item: 'Mirchi Bajji', price: 7.99 },
      { id: 43, item: 'Boba Drink', price: 6.99 },
      { id: 44, item: 'Samosa chat', price: 7.99 },
      { id: 45, item: 'Vegtable Dum Biryani', price: 8.99 },
      { id: 46, item: 'Masala Dosa', price: 8.99 },
      { id: 47, item: 'Podi Dosa', price: 8.99 },
      { id: 48, item: 'Plain Dosa', price: 7.99 },
      { id: 49, item: 'Mirchi bajji mixture', price: 7.99 },
    ],
  },
  {
    id: 6, stall: 'NH44', tradingName: 'NH 44',
    contact: 'SENTHIL ALAGIRI', mobile: '', email: 'senthilkumar1922@gmail.com',
    type: 'Friends', confirmed: 'Confirmed', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: true, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [
      { id: 27, item: 'Poori & Chana', price: 7.99 },
      { id: 28, item: 'Aloo Bonda', price: 4.99 },
      { id: 29, item: 'Falooda Bliss with Ice Cream', price: 5.99 },
      { id: 30, item: 'Lemon Soda', price: 2.99 },
      { id: 31, item: 'Spicy Butter Milk', price: 2.99 },
      { id: 32, item: 'Coffee / Masala Tea', price: 2.99 },
      { id: 33, item: 'Rose Milk', price: 3.99 },
      { id: 34, item: 'Pav Bhaji', price: 6.99 },
      { id: 35, item: 'Vada Pav', price: 5.99 },
    ],
  },
  {
    id: 7, stall: 'UTS', tradingName: 'UTS - Chennai Express',
    contact: 'Ramiah', mobile: '', email: '',
    type: 'Reg Org', confirmed: 'Confirmed', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: true, posMeeting: false, menuProvided: true, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [
      { id: 19, item: 'Parotta with Salna and Raita', price: 4.0 },
      { id: 20, item: 'Kothu Parotta', price: 7.0 },
      { id: 21, item: 'Chennai Veg Biriyani with Raita', price: 7.0 },
      { id: 22, item: 'Gobi 65', price: 7.0 },
      { id: 23, item: 'Nannari Sarbath Soda', price: 3.0 },
      { id: 24, item: 'Jigardhanda', price: 4.0 },
      { id: 25, item: 'Masala Mor', price: 2.0 },
      { id: 26, item: 'Rose cooler', price: 4.0 },
    ],
  },
  {
    id: 8, stall: 'Virasat', tradingName: '',
    contact: 'Eshani', mobile: '', email: '',
    type: 'Reg Org', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: true, posMeeting: false, menuProvided: true, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 9, stall: 'GTA', tradingName: 'GTA - Telangana Ruchulu',
    contact: 'Vishal', mobile: '', email: '',
    type: '', confirmed: 'Confirmed', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [
      { id: 60, item: 'Gudaalu', price: 3.99 },
      { id: 61, item: 'Chitti Punugulu', price: 5.99 },
      { id: 62, item: 'Gaarelu', price: 5.99 },
      { id: 63, item: 'Aaloo Bonda', price: 3.99 },
      { id: 64, item: 'Masala Corn', price: 3.99 },
      { id: 65, item: 'Bhel Puri', price: 3.99 },
      { id: 66, item: 'Combo 1 (Bagara Rice, Aloo Kuruma, Raita & Double Ka Meetha)', price: 9.99 },
      { id: 67, item: 'Combo 2 (Mango Pulihora, Gaarelu, Tomota Pachadi & Double Ka Meetha)', price: 10.99 },
      { id: 68, item: 'Combo 3 (Gaarelu, Badam Milk)', price: 7.49 },
      { id: 69, item: 'Combo 4 (Gudaalu, Badam Milk)', price: 5.49 },
      { id: 70, item: 'Badam Milk', price: 2.99 },
      { id: 71, item: 'Lassi Ice Cream Float', price: 4.99 },
      { id: 72, item: 'Watermelon Sharbath', price: 4.99 },
    ],
  },
  {
    id: 10, stall: 'TAU', tradingName: '',
    contact: '', mobile: '', email: '',
    type: 'Reg Org', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 11, stall: 'ODIYA', tradingName: '',
    contact: '', mobile: '', email: '',
    type: 'Reg Org', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: true, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 12, stall: 'Utah Desis', tradingName: '',
    contact: '', mobile: '', email: '',
    type: 'Reg Org', confirmed: 'Not this year', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 13, stall: 'Ajay', tradingName: '',
    contact: '', mobile: '', email: '',
    type: '', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 14, stall: 'Biriyani Avenue', tradingName: '',
    contact: '', mobile: '', email: '',
    type: '', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 15, stall: 'Pratik', tradingName: '',
    contact: '', mobile: '', email: '',
    type: 'Friends', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 16, stall: 'Aroma', tradingName: '',
    contact: '', mobile: '', email: '',
    type: '', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 17, stall: 'Sreedhar', tradingName: '',
    contact: '', mobile: '', email: '',
    type: 'Restaurant', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 18, stall: 'Ulhaas', tradingName: '',
    contact: '', mobile: '', email: '',
    type: 'Friends', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 19, stall: 'UMM', tradingName: '',
    contact: '', mobile: '', email: '',
    type: 'Reg Org', confirmed: 'Not this year', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 20, stall: 'NaKshatra Collection\'s', tradingName: '',
    contact: 'Nageswar Rao.G', mobile: '', email: 'nagesh_test@yahoo.com',
    type: '', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 21, stall: 'Heartfulness Meditation SLC', tradingName: '',
    contact: 'Shekhar Gupta', mobile: '', email: 'shekhargupta2k14@gmail.com',
    type: '', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 22, stall: 'Saritha Ignatius', tradingName: '',
    contact: '', mobile: '', email: '',
    type: '', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [],
  },
  {
    id: 23, stall: 'Radhe Krishna', tradingName: '',
    contact: '', mobile: '', email: '',
    type: '', confirmed: '', specialRequests: '',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [
      { id: 15, item: 'Pani Puri', price: 5.99 },
      { id: 16, item: 'Dabeli', price: 5.99 },
      { id: 17, item: 'Kesar Mango Lassi', price: 2.99 },
      { id: 18, item: 'Ice Gola', price: 2.99 },
    ],
  },
  {
    id: 24, stall: 'The Melting Mango', tradingName: '',
    contact: 'Sravya', mobile: '', email: 'contact.themeltingmango@gmail.com',
    type: 'Restaurant', confirmed: '', specialRequests: 'Interested in setting up an ice cream stall — needs more details',
    attendedMeeting1: false, attendedCityMeeting: false, posMeeting: false, menuProvided: false, poster: false, depositPaid: false, stallPayment: false, finalSettlement: false,
    menu: [
      { id: 73, item: 'Mango 1 Scoop', price: 5.75 },
      { id: 74, item: 'Pistachio 1 Scoop', price: 5.75 },
      { id: 75, item: 'Meetha Paan 1 Scoop', price: 5.75 },
      { id: 76, item: 'Pink Guava 1 Scoop', price: 5.75 },
      { id: 77, item: 'Mango 2 Scoops', price: 9.5 },
      { id: 78, item: 'Pistachio 2 Scoops', price: 9.5 },
      { id: 79, item: 'Meetha Paan 2 Scoops', price: 9.5 },
      { id: 80, item: 'Pink Guava 2 Scoops', price: 9.5 },
      { id: 81, item: 'Chocolate 1 Scoop', price: 5.75 },
      { id: 82, item: 'Chocolate 2 Sccops', price: 9.5 },
    ],
  },
]
