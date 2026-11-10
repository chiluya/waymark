// ---------------------------------------------------------------
// YOUR PLAN. Edit this file to change goals, stages or courses.
// Reps and posts are CUMULATIVE totals (the number you must reach
// by the end of that stage). Money goals and courses are tick-offs.
// ---------------------------------------------------------------

export const END = {
  upper: 200000,
  lower: 200000,
  ug: 6500,
  sr: 6500,
  cash: "K100,000",
};

export const ACCOUNTS = { ug: "@undergroundreacts", sr: "@speedrun.underground" };

export const STAGES = [
  {
    id: "s1",
    name: "Stage 1",
    reps: 15000,
    posts: 500,
    cash: "K750",
    money: [{ id: "s1-save", label: "K750 savings" }],
    courses: [
      "Linux & Terminal Basics",
      "Bash, Git & VS Code",
      "C Programming Basics",
      "Advanced C & OOP",
      "Python Basics",
      "Python Advanced",
    ],
  },
  {
    id: "s2",
    name: "Stage 2",
    reps: 40000,
    posts: 1500,
    cash: "K2,000",
    money: [{ id: "s2-save", label: "K2,000 savings" }],
    courses: [
      "Data Structures Intro",
      "Advanced DS in Python",
      "Networking Fundamentals",
      "Advanced Networking",
      "HTML",
      "CSS Basics",
    ],
  },
  {
    id: "s3",
    name: "Stage 3",
    reps: 80000,
    posts: 2500,
    cash: "K7,500",
    money: [
      { id: "s3-invest", label: "K2,000 savings invested in SaaS" },
      { id: "s3-return", label: "K5,000 return from SaaS" },
      { id: "s3-ug", label: "K2,500 from the pages" },
    ],
    courses: [
      "HTML & CSS Combined",
      "Advanced Layout",
      "JavaScript Basics",
      "Advanced JavaScript",
      "TypeScript",
      "React Basics",
    ],
  },
  {
    id: "s4",
    name: "Stage 4",
    reps: 130000,
    posts: 4000,
    cash: "K22,500",
    money: [
      { id: "s4-invest", label: "K7,500 savings invested in SaaS" },
      { id: "s4-return", label: "K20,000 return from SaaS" },
      { id: "s4-ug", label: "K2,500 from the pages" },
    ],
    courses: [
      "React Advanced",
      "Advanced React",
      "Tailwind CSS",
      "Node.js",
      "Express.js",
      "Authentication",
    ],
  },
  {
    id: "s5",
    name: "Stage 5",
    reps: 180000,
    posts: 5000,
    cash: "K80,000",
    money: [
      { id: "s5-invest", label: "K22,500 savings invested in SaaS" },
      { id: "s5-return", label: "K75,000 return from SaaS" },
      { id: "s5-ug", label: "K5,000 from the pages" },
    ],
    courses: [
      "FastAPI",
      "PostgreSQL",
      "MongoDB",
      "Prisma & SQLAlchemy",
      "Redis + DB Design",
      "Docker Foundations",
    ],
  },
  {
    id: "s6",
    name: "Stage 6",
    reps: 200000,
    posts: 6500,
    cash: "K115,000",
    money: [
      { id: "s6-invest", label: "K20,000 savings invested in SaaS" },
      { id: "s6-return", label: "K50,000 return from SaaS" },
      { id: "s6-ug", label: "K5,000 from the pages" },
      { id: "s6-save", label: "K60,000 savings" },
    ],
    courses: [
      "Advanced Docker",
      "Docker Compose",
      "GitHub Actions CI/CD",
      "AWS Fundamentals",
      "AWS Developer Deployment",
      "Terraform Infrastructure as Code",
    ],
  },
];

// Give every course a stable id
STAGES.forEach((s) => {
  s.courses = s.courses.map((label, i) => ({ id: `${s.id}-c${i + 1}`, label }));
});

export const END_GOAL_ID = "end-cash";
export const ALL_GOAL_IDS = [...STAGES.flatMap((s) => s.money.map((m) => m.id)), END_GOAL_ID];
export const ALL_COURSE_IDS = STAGES.flatMap((s) => s.courses.map((c) => c.id));
export const TOTAL_COURSES = ALL_COURSE_IDS.length;

export const initialState = () => ({
  logs: {},
  courses: {},
  goals: { "s1-save": true }, // K750 already saved
});
