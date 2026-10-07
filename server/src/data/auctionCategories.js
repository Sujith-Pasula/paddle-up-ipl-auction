// PADDLE UP auction category ordering.
// Real players are classified from the current project data; custom players are
// intentionally placed in the requested capped categories for game play.
export const AUCTION_CATEGORY_ORDER = [
  'CAPPED BATSMEN',
  'CAPPED FAST BOWLERS',
  'CAPPED ALL-ROUNDERS',
  'CAPPED WICKET-KEEPER BATSMEN',
  'CAPPED SPINNERS',
  'UNCAPPED BATSMEN',
  'UNCAPPED FAST BOWLERS',
  'UNCAPPED ALL-ROUNDERS',
  'UNCAPPED WICKET-KEEPER BATSMEN',
  'UNCAPPED SPINNERS',
  'DOMESTIC / EMERGING'
];

const spinnerNames = new Set([
  'Kuldeep Yadav','Yuzvendra Chahal','Varun Chakravarthy','Ravi Bishnoi','Rahul Chahar',
  'Rashid Khan','Adam Zampa','Tabraiz Shamsi','Imran Tahir','Mujeeb Ur Rahman','Adil Rashid',
  'Qais Ahmad','Rishad Hossain','Mohammad Waqar Salamkheil','Noor Ahmad','Kumar Kartikeya',
  'Kumar Kartikeya Singh','Mayank Markande','Shreyas Gopal','Prashant Solanki','Manav Suthar',
  'Murugan Ashwin','Himanshu Sharma','Vicky Ostwal','Sai Kishore','Digvesh Singh','Harpreet Brar',
  'Anukul Roy','Suyash Sharma','Karn Sharma','Shivam Shukla'
]);

const customSet = new Map([
  ['Devara','CAPPED FAST BOWLERS'],
  ['Bharath','CAPPED FAST BOWLERS'],
  ['Vinayak','CAPPED ALL-ROUNDERS'],
  ['Sujith','CAPPED ALL-ROUNDERS'],
  ['Saketh Rao','CAPPED BATSMEN'],
  ['Prakyath','CAPPED WICKET-KEEPER BATSMEN'],
]);

// Established/main IPL names in the project are treated as capped for the
// game's auction categorisation. Official 2026 auction-list additions that are
// not in this set remain uncapped unless explicitly marked.
const cappedNames = new Set();
const cappedBatters = [
 'Virat Kohli','Rohit Sharma','Shubman Gill','Suryakumar Yadav','Shreyas Iyer','Ruturaj Gaikwad',
 'Yashasvi Jaiswal','Faf du Plessis','David Warner','Kane Williamson','Steve Smith','Aiden Markram',
 'David Miller','Jason Roy','Jonny Bairstow','Travis Head','Rassie van der Dussen','Devon Conway',
 'Rahmanullah Gurbaz','Reeza Hendricks','Dawid Malan','Joe Root','Ross Taylor','Aaron Finch',
 'Martin Guptill','Ambati Rayudu','Ajinkya Rahane','Manish Pandey','Mayank Agarwal','Karun Nair',
 'Rahul Tripathi','Shikhar Dhawan','Prithvi Shaw','Nitish Rana','Rinku Singh','Ab de Villiers',
 'Chris Gayle','Suresh Raina','Yuvraj Singh','Sachin Tendulkar','Jake Fraser-McGurk'
];
const cappedFast = [
 'Jasprit Bumrah','Mohammed Shami','Mohammed Siraj','Bhuvneshwar Kumar','Arshdeep Singh','T Natarajan',
 'Avesh Khan','Prasidh Krishna','Umesh Yadav','Ishant Sharma','Deepak Chahar','Shardul Thakur',
 'Harshal Patel','Mukesh Kumar','Mitchell Starc','Pat Cummins','Josh Hazlewood','Jofra Archer',
 'Trent Boult','Kagiso Rabada','Lockie Ferguson','Mustafizur Rahman','Mark Wood','Anrich Nortje',
 'Gerald Coetzee','Matt Henry','Spencer Johnson','Dushmantha Chameera','Nandre Burger','Lungi Ngidi',
 'Zaheer Khan','Mohit Sharma','Sandeep Sharma','Navdeep Saini'
];
const cappedAll = [
 'Hardik Pandya','Ravindra Jadeja','Ravichandran Ashwin','Axar Patel','Washington Sundar','Shivam Dube',
 'Venkatesh Iyer','Nitish Kumar Reddy','Riyan Parag','Marcus Stoinis','Glenn Maxwell','Cameron Green',
 'Mitchell Marsh','Liam Livingstone','Sam Curran','Ben Stokes','Andre Russell','Sunil Narine',
 'Shakib Al Hasan','Mohammad Nabi','Sikandar Raza','Marco Jansen','Azmatullah Omarzai','Wanindu Hasaranga',
 'Moeen Ali','Rachin Ravindra','Krunal Pandya','Deepak Hooda','Shane Watson','Irfan Pathan','Kieron Pollard','Dwayne Bravo'
];
const cappedWk = [
 'Rishabh Pant','KL Rahul','Sanju Samson','Ishan Kishan','Jos Buttler','Quinton de Kock','Jonny Bairstow',
 'Nicholas Pooran','Phil Salt','Rahmanullah Gurbaz','Heinrich Klaasen','Devon Conway','Matthew Wade',
 'Mohammad Rizwan','Litton Das','Dinesh Karthik','MS Dhoni','Wriddhiman Saha','Robin Uthappa','Mushfiqur Rahim'
];
const cappedSpin = [
 'Kuldeep Yadav','Yuzvendra Chahal','Varun Chakravarthy','Ravi Bishnoi','Noor Ahmad','Rashid Khan',
 'Adam Zampa','Tabraiz Shamsi','Imran Tahir','Mujeeb Ur Rahman','Adil Rashid','Qais Ahmad','Rishad Hossain',
 'Mohammad Waqar Salamkheil','Harbhajan Singh','Anil Kumble'
];
for (const n of [...cappedBatters,...cappedFast,...cappedAll,...cappedWk,...cappedSpin]) cappedNames.add(n);

const uncappedRole = (p) => {
  if (p.role === 'Wicket-Keeper') return 'UNCAPPED WICKET-KEEPER BATSMEN';
  if (p.role === 'All-Rounder') return 'UNCAPPED ALL-ROUNDERS';
  if (p.role === 'Batsman') return 'UNCAPPED BATSMEN';
  if (p.role === 'Bowler') return spinnerNames.has(p.name) ? 'UNCAPPED SPINNERS' : 'UNCAPPED FAST BOWLERS';
  return 'DOMESTIC / EMERGING';
};

export function getAuctionCategory(player) {
  const forced = customSet.get(player.name);
  if (forced) return forced;
  if (cappedNames.has(player.name)) {
    if (cappedSpin.includes(player.name) || spinnerNames.has(player.name) && player.role === 'Bowler') return 'CAPPED SPINNERS';
    if (cappedWk.includes(player.name) || player.role === 'Wicket-Keeper') return 'CAPPED WICKET-KEEPER BATSMEN';
    if (cappedAll.includes(player.name) || player.role === 'All-Rounder') return 'CAPPED ALL-ROUNDERS';
    if (cappedFast.includes(player.name)) return 'CAPPED FAST BOWLERS';
    return 'CAPPED BATSMEN';
  }
  return uncappedRole(player);
}

export function categoryIndex(player) {
  const i = AUCTION_CATEGORY_ORDER.indexOf(getAuctionCategory(player));
  return i < 0 ? AUCTION_CATEGORY_ORDER.length : i;
}
