const avatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=07130f&color=fff&bold=true&size=512`;
const roleBase = {
  Batsman: { batting: 84, bowling: 18, fielding: 82 },
  'All-Rounder': { batting: 78, bowling: 72, fielding: 82 },
  'Wicket-Keeper': { batting: 80, bowling: 10, fielding: 86 },
  Bowler: { batting: 20, bowling: 84, fielding: 80 },
};
const make = (name, role, base=1, nationality='India') => {
  const seed=[...name].reduce((s,c)=>s+c.charCodeAt(0),0), r=roleBase[role];
  return {id:`ipl-main26-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`,name,role,basePrice:base,nationality,rating:Math.min(94,76+seed%19),batting:Math.min(99,r.batting+seed%12),bowling:Math.min(99,r.bowling+seed%11),fielding:Math.min(98,r.fielding+seed%13),photo:avatar(name),previousTeams:[],category:role,auctionYear:2026,mainIplPlayer:true};
};

// Main IPL stars / established players from the 2026 franchise ecosystem.
export const MAIN_IPL_STARS_2026 = [
 make('MS Dhoni','Wicket-Keeper',1.5), make('Sanju Samson','Wicket-Keeper',2), make('Ruturaj Gaikwad','Batsman',2), make('Shivam Dube','All-Rounder',2),
 make('Dewald Brevis','Batsman',1.5,'South Africa'), make('Ayush Mhatre','Batsman',0.75), make('Urvil Patel','Wicket-Keeper',0.75), make('Khaleel Ahmed','Bowler',1.5),
 make('KL Rahul','Wicket-Keeper',2), make('Axar Patel','All-Rounder',2), make('Kuldeep Yadav','Bowler',2), make('Mitchell Starc','Bowler',2,'Australia'), make('Nitish Rana','All-Rounder',1.5),
 make('Tristan Stubbs','Wicket-Keeper',2,'South Africa'), make('T Natarajan','Bowler',1.5), make('Sameer Rizvi','Batsman',0.75), make('Karun Nair','Batsman',0.75),
 make('Shubman Gill','Batsman',2), make('Jos Buttler','Wicket-Keeper',2,'England'), make('Rashid Khan','Bowler',2,'Afghanistan'), make('Mohammed Siraj','Bowler',2), make('Kagiso Rabada','Bowler',2,'South Africa'),
 make('Sai Sudharsan','Batsman',2), make('Shahrukh Khan','All-Rounder',1.5), make('Washington Sundar','All-Rounder',1.5), make('Rahul Tewatia','All-Rounder',1), make('Prasidh Krishna','Bowler',1.5),
 make('Ajinkya Rahane','Batsman',1), make('Rinku Singh','Batsman',2), make('Sunil Narine','All-Rounder',2,'West Indies'), make('Varun Chakaravarthy','Bowler',2), make('Harshit Rana','Bowler',1.5),
 make('Manish Pandey','Batsman',0.75), make('Ramandeep Singh','All-Rounder',0.75), make('Vaibhav Arora','Bowler',0.75), make('Umran Malik','Bowler',1),
 make('Rishabh Pant','Wicket-Keeper',2), make('Aiden Markram','All-Rounder',2,'South Africa'), make('Nicholas Pooran','Wicket-Keeper',2,'West Indies'), make('Mayank Yadav','Bowler',2),
 make('Avesh Khan','Bowler',1.5), make('Mohsin Khan','Bowler',1), make('Shahbaz Ahmed','All-Rounder',1), make('Ayush Badoni','All-Rounder',1), make('Abdul Samad','All-Rounder',1),
 make('Rohit Sharma','Batsman',2), make('Suryakumar Yadav','Batsman',2), make('Jasprit Bumrah','Bowler',2), make('Hardik Pandya','All-Rounder',2), make('Tilak Varma','Batsman',2),
 make('Deepak Chahar','Bowler',1.5), make('Shardul Thakur','All-Rounder',1.5), make('Naman Dhir','All-Rounder',0.75), make('Mayank Markande','Bowler',0.75),
 make('Shreyas Iyer','Batsman',2), make('Arshdeep Singh','Bowler',2), make('Yuzvendra Chahal','Bowler',2), make('Marco Jansen','All-Rounder',2,'South Africa'), make('Marcus Stoinis','All-Rounder',2,'Australia'),
 make('Shashank Singh','All-Rounder',1), make('Nehal Wadhera','Batsman',0.75), make('Prabhsimran Singh','Wicket-Keeper',0.75), make('Harpreet Brar','All-Rounder',0.75), make('Musheer Khan','All-Rounder',0.75),
 make('Ravindra Jadeja','All-Rounder',2), make('Jofra Archer','Bowler',2,'England'), make('Riyan Parag','All-Rounder',2), make('Sam Curran','All-Rounder',2,'England'), make('Yashaswi Jaiswal','Batsman',2),
 make('Sandeep Sharma','Bowler',0.75), make('Shimron Hetmyer','Batsman',1.5,'West Indies'), make('Tushar Deshpande','Bowler',0.75), make('Vaibhav Suryavanshi','Batsman',0.75),
 make('Virat Kohli','Batsman',2), make('Rajat Patidar','Batsman',2), make('Bhuvneshwar Kumar','Bowler',1.5), make('Jitesh Sharma','Wicket-Keeper',1.5), make('Josh Hazlewood','Bowler',2,'Australia'),
 make('Krunal Pandya','All-Rounder',1.5), make('Phil Salt','Wicket-Keeper',2,'England'), make('Tim David','All-Rounder',1.5,'Australia'), make('Devdutt Padikkal','Batsman',1),
 make('Abhishek Sharma','All-Rounder',2), make('Heinrich Klaasen','Wicket-Keeper',2,'South Africa'), make('Ishan Kishan','Wicket-Keeper',2), make('Pat Cummins','Bowler',2,'Australia'), make('Travis Head','Batsman',2,'Australia'),
 make('Nitish Kumar Reddy','All-Rounder',1.5), make('Harshal Patel','Bowler',1.5), make('Rahul Chahar','Bowler',1), make('Jaydev Unadkat','Bowler',0.75), make('Anshul Kamboj','All-Rounder',0.75)
];
